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
