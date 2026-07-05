/**
 * SHIFT Client Portal backend — Google Apps Script web app.
 * Deploy: Execute as Me · Who has access: Anyone. See apps-script/SETUP.md.
 * Script Properties: PORTAL_SECRET, ADMIN_KEY, NOTIFY_EMAILS, ROOT_FOLDER_ID (optional).
 * Tested from Node via tests/gs-harness.mjs — keep functions global, no classes.
 */

// ── Pure helpers ─────────────────────────────────────────────

// GAS computeHmacSha256Signature returns SIGNED bytes (-128..127); normalize.
function hexFromBytes_(bytes) {
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    var h = ((bytes[i] + 256) % 256).toString(16);
    out += h.length < 2 ? '0' + h : h;
  }
  return out;
}

function hmacHex_(msg, secret) {
  return hexFromBytes_(Utilities.computeHmacSha256Signature(msg, secret));
}

function parseToken_(token) {
  var s = String(token || '');
  var i = s.lastIndexOf('.');
  if (i <= 0 || i === s.length - 1) return null;
  try {
    var payload = Utilities.newBlob(Utilities.base64Decode(s.slice(0, i))).getDataAsString();
    return { payload: payload, sig: s.slice(i + 1) };
  } catch (e) { return null; }
}

function verifyToken_(token, secret, nowSec) {
  var t = parseToken_(token);
  if (!t) return { ok: false, error: 'invalid' };
  if (t.sig !== hmacHex_(t.payload, secret).slice(0, 32)) return { ok: false, error: 'invalid' };
  var parts = t.payload.split('|');
  var exp = parseInt(parts[1], 10);
  if (isNaN(exp)) return { ok: false, error: 'invalid' };
  if (nowSec > exp) return { ok: false, error: 'expired' };
  return { ok: true, name: parts[0], exp: exp, driveId: parts[2] || '' };
}

function sanitizeFilename_(name) {
  var n = String(name || '')
    .replace(/[\/\\]/g, '')
    .replace(/[\x00-\x1f]/g, '')
    .replace(/\.\.+/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  if (!n) n = 'file';
  return n.length > 120 ? n.slice(0, 120) : n;
}

function isImageMime_(m) { return /^image\//.test(String(m || '')); }

function thumbUrl_(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
}

// ── Config + storage ─────────────────────────────────────────

var SHEET_NAME = 'SHIFT Portal Data';
var CLIENT_COLS = ['clientName', 'folderId', 'folderSource', 'avatarFileId', 'logoFileId', 'monogramFileId', 'lastSeen'];

function props_() { return PropertiesService.getScriptProperties(); }
function cfg_(k, dflt) { return props_().getProperty(k) || dflt || ''; }

function ss_() {
  var id = cfg_('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var ss = SpreadsheetApp.create(SHEET_NAME);
  props_().setProperty('SHEET_ID', ss.getId());
  return ss;
}

function sheet_(name, headers) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); }
  return sh;
}
function clientsSheet_()  { return sheet_('Clients', CLIENT_COLS); }
function notesSheet_()    { return sheet_('Notes', ['timestamp', 'clientName', 'proposalId', 'author', 'text']); }
function activitySheet_() { return sheet_('Activity', ['timestamp', 'clientName', 'type', 'detail', 'link']); }

function getClientRow_(name) {
  var data = clientsSheet_().getDataRange().getValues();
  var needle = String(name || '').toLowerCase();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][0]).toLowerCase() === needle) {
      var rec = {};
      for (var c = 0; c < CLIENT_COLS.length; c++) rec[CLIENT_COLS[c]] = data[r][c] == null ? '' : data[r][c];
      rec._row = r + 1;
      return rec;
    }
  }
  return null;
}

function upsertClient_(name, patch) {
  var sh = clientsSheet_();
  var rec = getClientRow_(name);
  var k;
  if (!rec) {
    rec = { clientName: name, folderId: '', folderSource: '', avatarFileId: '', logoFileId: '', monogramFileId: '', lastSeen: new Date().toISOString() };
    for (k in (patch || {})) rec[k] = patch[k];
    sh.appendRow(CLIENT_COLS.map(function (c) { return rec[c]; }));
    return rec;
  }
  for (k in (patch || {})) rec[k] = patch[k];
  rec.lastSeen = new Date().toISOString();
  sh.getRange(rec._row, 1, 1, CLIENT_COLS.length).setValues([CLIENT_COLS.map(function (c) { return rec[c]; })]);
  return rec;
}

// ── HTTP entry + router ──────────────────────────────────────

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, service: 'SHIFT Portal Backend', time: new Date().toISOString() });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: 'bad-request' }); }
  try { return json_(dispatch_(body)); }
  catch (err) { return json_({ ok: false, error: 'server', detail: String(err) }); }
}

var CLIENT_ACTIONS = { 'verify': 1, 'upload': 1, 'files.list': 1, 'notes.list': 1, 'notes.add': 1 };
var ADMIN_ACTIONS = { 'admin.activity': 1, 'admin.reply': 1 };

function dispatch_(body) {
  var action = String(body.action || '');
  if (ADMIN_ACTIONS[action]) {
    if (!body.adminKey || body.adminKey !== cfg_('ADMIN_KEY')) return { ok: false, error: 'unauthorized' };
    return action === 'admin.activity' ? adminActivity_(body) : adminReply_(body);
  }
  if (!CLIENT_ACTIONS[action]) return { ok: false, error: 'unknown-action' };
  var v = verifyToken_(body.token, cfg_('PORTAL_SECRET'), Math.floor(Date.now() / 1000));
  if (!v.ok) return v;
  if (action === 'verify') return verifyAction_(v);
  if (action === 'upload') return uploadAction_(v, body);
  if (action === 'files.list') return filesList_(v);
  if (action === 'notes.list') return notesList_(v, body);
  return notesAdd_(v, body); // notes.add
}

function verifyAction_(v) {
  var rec = getClientRow_(v.name);
  return {
    ok: true, clientName: v.name, exp: v.exp,
    profile: {
      driveFolderId: (rec && rec.folderId) || v.driveId || '',
      avatarUrl: rec && rec.avatarFileId ? thumbUrl_(rec.avatarFileId) : '',
      logoUrl: rec && rec.logoFileId ? thumbUrl_(rec.logoFileId) : '',
      monogramUrl: rec && rec.monogramFileId ? thumbUrl_(rec.monogramFileId) : ''
    }
  };
}

// ── Drive folders (hybrid resolution) ────────────────────────

function rootFolder_() {
  var rootId = cfg_('ROOT_FOLDER_ID');
  if (rootId) return DriveApp.getFolderById(rootId);
  var it = DriveApp.getFoldersByName('SHIFT Clients');
  return it.hasNext() ? it.next() : DriveApp.createFolder('SHIFT Clients');
}

function subFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// Hybrid rule: recorded folder -> token's manual folder -> auto-create.
function resolveClientFolder_(name, tokenDriveId) {
  var rec = getClientRow_(name);
  if (rec && rec.folderId) {
    try { return DriveApp.getFolderById(rec.folderId); }
    catch (e) { /* folder was deleted -- fall through and re-resolve */ }
  }
  if (tokenDriveId) {
    var f = DriveApp.getFolderById(tokenDriveId);
    upsertClient_(name, { folderId: tokenDriveId, folderSource: 'manual' });
    return f;
  }
  var created = rootFolder_().createFolder(name);
  upsertClient_(name, { folderId: created.getId(), folderSource: 'auto' });
  return created;
}

// ── Upload ───────────────────────────────────────────────────

var MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
var KIND_FIELD = { avatar: 'avatarFileId', logo: 'logoFileId', monogram: 'monogramFileId' };

function uploadAction_(v, body) {
  var kind = KIND_FIELD[body.kind] ? body.kind : 'file';
  var name = sanitizeFilename_(body.filename);
  var bytes;
  try { bytes = Utilities.base64Decode(String(body.dataB64 || '')); }
  catch (e) { return { ok: false, error: 'bad-file' }; }
  if (!bytes.length) return { ok: false, error: 'bad-file' };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, error: 'too-big' };

  var folder = resolveClientFolder_(v.name, v.driveId);
  var sub = subFolder_(folder, kind === 'file' ? 'Uploads' : 'Brand Assets');
  var file = sub.createFile(Utilities.newBlob(bytes, body.mimeType || 'application/octet-stream', name));

  var isImg = isImageMime_(body.mimeType);
  if (isImg) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  if (KIND_FIELD[kind]) {
    var patch = {};
    patch[KIND_FIELD[kind]] = file.getId();
    upsertClient_(v.name, patch);
  }

  logActivity_(v.name, 'upload', kind + ': ' + name, file.getUrl());
  notify_(
    '📁 ' + v.name + ' uploaded ' + name,
    escHtml_(v.name) + ' uploaded <b>' + escHtml_(name) + '</b> (' + kind + ')<br><br>' +
    '<a href="' + file.getUrl() + '">Open file</a> · ' +
    '<a href="https://drive.google.com/drive/folders/' + folder.getId() + '">Client folder</a>'
  );
  return { ok: true, fileId: file.getId(), fileUrl: file.getUrl(), thumbUrl: isImg ? thumbUrl_(file.getId()) : '' };
}

// ── Activity + notifications ─────────────────────────────────

function logActivity_(client, type, detail, link) {
  activitySheet_().appendRow([new Date().toISOString(), client, type, detail, link || '']);
}

function escHtml_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function notify_(subject, html) {
  MailApp.sendEmail({
    to: cfg_('NOTIFY_EMAILS', 'ventas@5hift.com.mx,Produccion@5hift.com.mx'),
    subject: subject,
    htmlBody: html
  });
}

// ── Files listing ────────────────────────────────────────────────

function filesList_(v) {
  var rec = getClientRow_(v.name);
  var folderId = (rec && rec.folderId) || v.driveId || '';
  if (!folderId) return { ok: true, files: [] };
  var folder;
  try { folder = DriveApp.getFolderById(folderId); }
  catch (e) { return { ok: true, files: [] }; }
  var files = [];
  var subs = ['Uploads', 'Brand Assets'];
  for (var s = 0; s < subs.length; s++) {
    var it = folder.getFoldersByName(subs[s]);
    if (!it.hasNext()) continue;
    var fit = it.next().getFiles();
    while (fit.hasNext() && files.length < 100) {
      var f = fit.next();
      var mime = f.getMimeType();
      files.push({
        id: f.getId(), name: f.getName(), size: f.getSize(),
        date: f.getDateCreated().toISOString(), folder: subs[s],
        isImage: isImageMime_(mime),
        thumbUrl: isImageMime_(mime) ? thumbUrl_(f.getId()) : '',
        url: f.getUrl()
      });
    }
  }
  files.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  return { ok: true, files: files };
}

// ── Notes ────────────────────────────────────────────────────

function notesList_(v, body) {
  var pid = String(body.proposalId || 'general');
  var data = notesSheet_().getDataRange().getValues();
  var needle = v.name.toLowerCase();
  var out = [];
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][1]).toLowerCase() !== needle) continue;
    if (pid !== '*' && String(data[r][2]) !== pid) continue;
    out.push({ ts: data[r][0], proposalId: String(data[r][2]), author: data[r][3], text: data[r][4] });
  }
  return { ok: true, notes: out };
}

function notesAdd_(v, body) {
  var text = String(body.text || '').trim().slice(0, 4000);
  if (!text) return { ok: false, error: 'empty' };
  var pid = String(body.proposalId || 'general');
  notesSheet_().appendRow([new Date().toISOString(), v.name, pid, 'client', text]);
  logActivity_(v.name, 'note', pid + ': ' + text.slice(0, 140), '');
  notify_(
    '💬 New note from ' + v.name + (pid !== 'general' ? ' · ' + pid : ''),
    '<b>' + escHtml_(v.name) + '</b> wrote on <i>' + escHtml_(pid) + '</i>:<br><br>' +
    escHtml_(text).replace(/\n/g, '<br>')
  );
  return { ok: true };
}

// ── Admin (manager-only) ─────────────────────────────────────

function adminActivity_(body) {
  var limit = Number(body.limit || 50);
  var data = activitySheet_().getDataRange().getValues();
  var activity = [];
  for (var r = data.length - 1; r >= 1 && activity.length < limit; r--) {
    activity.push({ ts: data[r][0], client: data[r][1], type: data[r][2], detail: data[r][3], link: data[r][4] });
  }
  var nd = notesSheet_().getDataRange().getValues();
  var notes = [];
  for (var n = nd.length - 1; n >= 1 && notes.length < 100; n--) {
    notes.push({ ts: nd[n][0], client: nd[n][1], proposalId: String(nd[n][2]), author: nd[n][3], text: nd[n][4] });
  }
  return { ok: true, activity: activity, notes: notes };
}

function adminReply_(body) {
  var text = String(body.text || '').trim().slice(0, 4000);
  var client = String(body.clientName || '').trim();
  if (!text || !client) return { ok: false, error: 'empty' };
  notesSheet_().appendRow([new Date().toISOString(), client, String(body.proposalId || 'general'), 'shift', text]);
  return { ok: true };
}
