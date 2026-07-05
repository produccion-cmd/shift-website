# SHIFT Client Portal 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the static client portal so clients can upload files to the SHIFT Google Drive (Produccion@5hift.com.mx), add logos/monograms/profile pictures, hold two-way notes threads on proposals, and trigger email notifications — all via a new Google Apps Script backend.

**Architecture:** A single Apps Script web app (`apps-script/portal-backend.gs`) is the only backend. The portal page (`SHIFT_proposals_hub.html`) and manager (`manager_v2.html`) call it with `fetch` POST + JSON string bodies (Content-Type stays `text/plain` → no CORS preflight; Apps Script allows this). Backend state lives in a Google Sheet ("SHIFT Portal Data") and Google Drive folders. Backend pure logic is TDD'd in Node via a `vm`-based harness that stubs GAS globals; UI work is verified against a local Node mock backend that implements the same JSON protocol.

**Tech Stack:** Google Apps Script (V8), vanilla JS in two existing single-file HTML pages, Node 24 built-in test runner (`node --test`, zero npm deps).

**Spec:** `docs/superpowers/specs/2026-07-05-client-portal-upgrade-design.md`

## Global Constraints

- **Google account: everything backend-side belongs to Produccion@5hift.com.mx** (Apps Script owner, Drive folders, "SHIFT Portal Data" sheet, email sender). SHIFT and DJD are separate businesses — the desijunctiondjs account is never involved.
- Notification recipients (default, overridable via Script Property `NOTIFY_EMAILS`): `ventas@5hift.com.mx,Produccion@5hift.com.mx`
- Backend per-file cap: 25 MB decoded (`MAX_UPLOAD_BYTES = 25 * 1024 * 1024`); portal client-side cap: 20 MB (`MAX_MB = 20`) with message directing to the Drive folder.
- Token format (unchanged, secret rotated): `btoa("name|expUnixSeconds[|driveFolderId]") + "." + hmacSha256Hex(payload, secret).slice(0,32)`.
- **No secrets in committed source.** The old secret `SHIFTportal#2026$key!xK9mPq3` is burned (public in git history). The new secret lives ONLY in the manager's localStorage (`shift-portal-secret`) and Apps Script Script Properties (`PORTAL_SECRET`). This supersedes the spec line "manager still embeds the secret" — storing it in Settings is the same effort and strictly safer.
- Repo is PUBLIC GitHub Pages. Never commit client data, keys, or the deployed backend URL is OK to commit (it is public-by-design; tokens are the security boundary).
- Portal/manager visual language: existing dark theme. Portal uses Tailwind classes + existing custom colors (`text-primary`, `border-outline-variant`, `bg-background`, fonts Sora=`font-display`, Inter=`font-body`). Manager uses its own CSS vars (`--border`, `--gray`, `--dim`, `--white`, `--gold`, `--red`) and classes (`settings-block`, `f-input`, `f-label`, `save-btn`, `settings-hint`, `link-h2`).
- All backend responses: `{ok:true,…}` or `{ok:false,error:"<code>"}`. Error codes used: `bad-request`, `unknown-action`, `unauthorized`, `invalid`, `expired`, `bad-file`, `too-big`, `empty`, `server`.
- Commit after every task (repo convention: `feat:`/`fix:`/`docs:`/`test:` prefixes, no attribution footer). Do NOT `git push` — pushing deploys the live site; Edwin pushes when ready.
- GAS code style: `function name_()` private suffix convention, `var` (GAS-idiomatic), no arrow functions in `.gs` (works on V8 but keep it uniform and paste-safe).

---

### Task 1: Node test harness + backend pure core (token, hex, filenames)

**Files:**
- Create: `apps-script/portal-backend.gs`
- Create: `tests/gs-harness.mjs`
- Test: `tests/backend-core.test.mjs`

**Interfaces:**
- Produces (used by every later backend task):
  - `loadBackend(overrides?) → sandbox` (harness): loads the `.gs` into a `vm` context with GAS stubs; all top-level `.gs` functions are properties of `sandbox`.
  - `makeToken(payload, secret) → string` (harness): builds a valid browser-style token.
  - `.gs`: `hexFromBytes_(signedBytes[]) → hexString`, `hmacHex_(msg, secret) → hexString`, `parseToken_(token) → {payload,sig}|null`, `verifyToken_(token, secret, nowSec) → {ok:true,name,exp,driveId}|{ok:false,error:'invalid'|'expired'}`, `sanitizeFilename_(name) → string`, `isImageMime_(mime) → bool`, `thumbUrl_(fileId) → string`.
  - Harness stubs exposed for assertions: `sandbox._props` (Script Properties object), `sandbox._sentEmails` (array of MailApp calls), `sandbox.SpreadsheetApp._books`, `sandbox.DriveApp._root` / `._byId`.

- [ ] **Step 1: Write the harness**

Create `tests/gs-harness.mjs`:

```javascript
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import vm from 'node:vm';

// Load apps-script/portal-backend.gs into a vm context with GAS service stubs.
// Top-level function declarations in the .gs become properties of the sandbox.
export function loadBackend(overrides = {}) {
  const src = readFileSync(new URL('../apps-script/portal-backend.gs', import.meta.url), 'utf8');
  const sandbox = { ...gasStubs(), ...overrides };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

// Browser-side token builder (mirrors manager_v2.html generateLink()).
export function makeToken(payload, secret) {
  const sig = createHmac('sha256', secret).update(payload, 'utf8').digest('hex').slice(0, 32);
  return Buffer.from(payload, 'utf8').toString('base64') + '.' + sig;
}

export function gasStubs() {
  const props = {};
  const sentEmails = [];
  const sandbox = {
    console,
    _props: props,
    _sentEmails: sentEmails,
    Utilities: {
      // GAS returns SIGNED bytes (-128..127) — the stub must too, so
      // hexFromBytes_ is forced to normalize.
      computeHmacSha256Signature: (msg, key) => {
        const dig = createHmac('sha256', key).update(msg, 'utf8').digest();
        return [...dig].map((b) => (b > 127 ? b - 256 : b));
      },
      base64Decode: (b64) => {
        if (!/^[A-Za-z0-9+/=]*$/.test(b64)) throw new Error('bad base64');
        return [...Buffer.from(b64, 'base64')];
      },
      newBlob: (bytes, mime, name) => ({
        _bytes: bytes, _mime: mime, _name: name,
        getDataAsString: () => Buffer.from(bytes.map((b) => (b + 256) % 256)).toString('utf8'),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k in props ? props[k] : null),
        setProperty: (k, v) => { props[k] = v; },
      }),
    },
    MailApp: { sendEmail: (opts) => sentEmails.push(opts) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ _text: s, setMimeType() { return this; } }),
    },
  };
  sandbox.SpreadsheetApp = fakeSpreadsheetApp();
  sandbox.DriveApp = fakeDriveApp();
  return sandbox;
}

function fakeSpreadsheetApp() {
  const books = {};
  const makeSheet = () => {
    const rows = [];
    return {
      _rows: rows,
      appendRow: (r) => rows.push([...r]),
      getDataRange: () => ({ getValues: () => rows.map((r) => [...r]) }),
      getRange: (row, _col, _nr, _nc) => ({ setValues: (vals) => { rows[row - 1] = [...vals[0]]; } }),
    };
  };
  const makeBook = (id) => {
    const sheets = {};
    return {
      _sheets: sheets,
      getId: () => id,
      getSheetByName: (n) => sheets[n] || null,
      insertSheet: (n) => (sheets[n] = makeSheet()),
    };
  };
  return {
    _books: books,
    create: () => { const id = 'ss-' + Object.keys(books).length; books[id] = makeBook(id); return books[id]; },
    openById: (id) => books[id],
  };
}

function fakeDriveApp() {
  let seq = 0;
  const byId = {};
  const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
  const makeFile = (name, mime, bytes) => {
    const f = {
      _shared: false,
      getName: () => name, getMimeType: () => mime,
      getSize: () => bytes.length,
      getDateCreated: () => new Date('2026-07-05T12:00:00Z'),
      getUrl: () => 'https://drive.example/file/' + f._id,
      getId: () => f._id,
      setSharing: () => { f._shared = true; return f; },
    };
    f._id = 'f' + ++seq; byId[f._id] = f; return f;
  };
  const makeFolder = (name) => {
    const files = [], folders = [];
    const fo = {
      _files: files, _folders: folders,
      getName: () => name, getId: () => fo._id,
      createFolder: (n) => { const c = makeFolder(n); folders.push(c); return c; },
      getFoldersByName: (n) => iter(folders.filter((x) => x.getName() === n)),
      getFiles: () => iter(files),
      createFile: (blob) => { const f = makeFile(blob._name, blob._mime, blob._bytes); files.push(f); return f; },
    };
    fo._id = 'fo' + ++seq; byId[fo._id] = fo; return fo;
  };
  const root = { _folders: [] };
  return {
    _byId: byId, _root: root,
    Access: { ANYONE_WITH_LINK: 'anyone' },
    Permission: { VIEW: 'view' },
    getFolderById: (id) => { if (!byId[id]) throw new Error('not found: ' + id); return byId[id]; },
    getFoldersByName: (n) => iter(root._folders.filter((x) => x.getName() === n)),
    createFolder: (n) => { const f = makeFolder(n); root._folders.push(f); return f; },
  };
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/backend-core.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackend, makeToken } from './gs-harness.mjs';

const SECRET = 'test-secret';
const NOW = 1_800_000_000; // fixed "now" in unix seconds

test('hexFromBytes_ normalizes GAS signed bytes', () => {
  const gs = loadBackend();
  assert.equal(gs.hexFromBytes_([0, 15, -1, -128, 127]), '000fff807f');
});

test('verifyToken_ accepts a valid browser-built token', () => {
  const gs = loadBackend();
  const t = makeToken(`Palwinder Chamdal|${NOW + 3600}|1AbCdEfGhIjKl`, SECRET);
  const v = gs.verifyToken_(t, SECRET, NOW);
  assert.deepEqual(v, { ok: true, name: 'Palwinder Chamdal', exp: NOW + 3600, driveId: '1AbCdEfGhIjKl' });
});

test('verifyToken_ accepts token without driveId', () => {
  const gs = loadBackend();
  const v = gs.verifyToken_(makeToken(`Alex Padilla|${NOW + 60}`, SECRET), SECRET, NOW);
  assert.equal(v.ok, true);
  assert.equal(v.driveId, '');
});

test('verifyToken_ rejects expired token', () => {
  const gs = loadBackend();
  const v = gs.verifyToken_(makeToken(`Alex|${NOW - 1}`, SECRET), SECRET, NOW);
  assert.deepEqual(v, { ok: false, error: 'expired' });
});

test('verifyToken_ rejects tampered signature and wrong secret', () => {
  const gs = loadBackend();
  const good = makeToken(`Alex|${NOW + 60}`, SECRET);
  assert.equal(gs.verifyToken_(good.slice(0, -1) + (good.endsWith('0') ? '1' : '0'), SECRET, NOW).error, 'invalid');
  assert.equal(gs.verifyToken_(good, 'other-secret', NOW).error, 'invalid');
});

test('verifyToken_ rejects malformed tokens', () => {
  const gs = loadBackend();
  for (const bad of ['', 'no-dot', '!!!.abc', makeToken('NameOnlyNoExp', SECRET)]) {
    assert.equal(gs.verifyToken_(bad, SECRET, NOW).ok, false);
  }
});

test('sanitizeFilename_ strips paths, control chars, caps length', () => {
  const gs = loadBackend();
  assert.equal(gs.sanitizeFilename_('../../etc/passwd'), '.etcpasswd');
  assert.equal(gs.sanitizeFilename_('logo\u0000\u001f final.png'), 'logo final.png');
  assert.equal(gs.sanitizeFilename_(''), 'file');
  assert.equal(gs.sanitizeFilename_('a'.repeat(200)).length, 120);
});

test('isImageMime_ and thumbUrl_', () => {
  const gs = loadBackend();
  assert.equal(gs.isImageMime_('image/png'), true);
  assert.equal(gs.isImageMime_('application/pdf'), false);
  assert.equal(gs.thumbUrl_('X1'), 'https://drive.google.com/thumbnail?id=X1&sz=w400');
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ~/shift-website && node --test tests/`
Expected: FAIL — `ENOENT ... apps-script/portal-backend.gs` (file doesn't exist yet).

- [ ] **Step 4: Write the pure core**

Create `apps-script/portal-backend.gs`:

```javascript
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
    .replace(/[\u0000-\u001f]/g, '')
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ~/shift-website && node --test tests/`
Expected: PASS — 8 tests, 0 failures. (If `sanitizeFilename_('../../etc/passwd')` fails: the regex order matters — strip slashes first, then collapse `..`.)

- [ ] **Step 6: Commit**

```bash
cd ~/shift-website
git add apps-script/portal-backend.gs tests/gs-harness.mjs tests/backend-core.test.mjs
git commit -m "feat: portal backend pure core (token verify, sanitize) + GAS test harness"
```

---

### Task 2: Backend dispatch, config, Sheet layer, `verify` action

**Files:**
- Modify: `apps-script/portal-backend.gs` (append)
- Test: `tests/backend-dispatch.test.mjs`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces:
  - `dispatch_(body) → responseObject` — the single router; `doPost(e)` wraps it.
  - `cfg_(key, dflt) → string` — Script Property reader.
  - `clientsSheet_()/notesSheet_()/activitySheet_()` — lazily-created tabs in spreadsheet "SHIFT Portal Data" (id cached in Script Property `SHEET_ID`).
  - `getClientRow_(name) → rec|null`, `upsertClient_(name, patch) → rec` where rec keys = `clientName, folderId, folderSource, avatarFileId, logoFileId, monogramFileId, lastSeen` (+ `_row` on reads).
  - Wire protocol for `verify`: request `{action:'verify', token}` → `{ok:true, clientName, exp, profile:{driveFolderId, avatarUrl, logoUrl, monogramUrl}}`.

- [ ] **Step 1: Write the failing tests**

Create `tests/backend-dispatch.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackend, makeToken } from './gs-harness.mjs';

const SECRET = 'test-secret';
const NOW = Math.floor(Date.now() / 1000);

function boot() {
  const gs = loadBackend();
  gs._props.PORTAL_SECRET = SECRET;
  gs._props.ADMIN_KEY = 'admin-key-1';
  return gs;
}

test('dispatch_ rejects unknown action and bad token', () => {
  const gs = boot();
  assert.equal(gs.dispatch_({ action: 'nope' }).error, 'unknown-action');
  assert.equal(gs.dispatch_({ action: 'verify', token: 'garbage' }).error, 'invalid');
  assert.equal(gs.dispatch_({ action: 'verify', token: makeToken(`X|${NOW - 5}`, SECRET) }).error, 'expired');
});

test('dispatch_ guards admin actions with ADMIN_KEY', () => {
  const gs = boot();
  assert.equal(gs.dispatch_({ action: 'admin.activity' }).error, 'unauthorized');
  assert.equal(gs.dispatch_({ action: 'admin.activity', adminKey: 'wrong' }).error, 'unauthorized');
});

test('verify returns profile; unknown client gets empty profile with token driveId', () => {
  const gs = boot();
  const r = gs.dispatch_({ action: 'verify', token: makeToken(`New Client|${NOW + 60}|1DriveXyz`, SECRET) });
  assert.equal(r.ok, true);
  assert.equal(r.clientName, 'New Client');
  assert.deepEqual(r.profile, { driveFolderId: '1DriveXyz', avatarUrl: '', logoUrl: '', monogramUrl: '' });
});

test('verify surfaces stored avatar/logo/monogram as thumbnail urls', () => {
  const gs = boot();
  gs.upsertClient_('Priya Raj', { avatarFileId: 'fA', logoFileId: 'fL', folderId: 'foX' });
  const r = gs.dispatch_({ action: 'verify', token: makeToken(`Priya Raj|${NOW + 60}`, SECRET) });
  assert.equal(r.profile.avatarUrl, 'https://drive.google.com/thumbnail?id=fA&sz=w400');
  assert.equal(r.profile.logoUrl, 'https://drive.google.com/thumbnail?id=fL&sz=w400');
  assert.equal(r.profile.monogramUrl, '');
  assert.equal(r.profile.driveFolderId, 'foX');
});

test('upsertClient_ is case-insensitive and patches in place', () => {
  const gs = boot();
  gs.upsertClient_('Alex Padilla', { folderId: 'fo1' });
  gs.upsertClient_('alex padilla', { logoFileId: 'f9' });
  const rec = gs.getClientRow_('ALEX PADILLA');
  assert.equal(rec.folderId, 'fo1');
  assert.equal(rec.logoFileId, 'f9');
  // exactly one data row (plus header)
  const book = Object.values(gs.SpreadsheetApp._books)[0];
  assert.equal(book._sheets['Clients']._rows.length, 2);
});

test('doPost parses JSON and returns JSON text output', () => {
  const gs = boot();
  const out = gs.doPost({ postData: { contents: JSON.stringify({ action: 'verify', token: makeToken(`A|${NOW + 60}`, SECRET) }) } });
  assert.equal(JSON.parse(out._text).ok, true);
  const bad = gs.doPost({ postData: { contents: '{not json' } });
  assert.equal(JSON.parse(bad._text).error, 'bad-request');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: new file FAILS with `dispatch_ is not a function`; Task 1 tests still PASS.

- [ ] **Step 3: Append the dispatch + sheet layer to `apps-script/portal-backend.gs`**

```javascript
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
```

Note: `uploadAction_`, `filesList_`, `notesList_`, `notesAdd_`, `adminActivity_`, `adminReply_` don't exist yet — Tasks 3–4 add them. The dispatch tests in THIS task only exercise `verify` and the guards, so `node --test` must not reference the missing ones.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — all Task 1 + Task 2 tests (14 total).

- [ ] **Step 5: Commit**

```bash
git add apps-script/portal-backend.gs tests/backend-dispatch.test.mjs
git commit -m "feat: portal backend dispatch, sheet layer, server-side verify"
```

---

### Task 3: Backend `upload` — hybrid folder resolution, Drive write, notification email

**Files:**
- Modify: `apps-script/portal-backend.gs` (append)
- Test: `tests/backend-upload.test.mjs`

**Interfaces:**
- Consumes: Task 2 sheet layer + dispatch (dispatch already routes `upload` → `uploadAction_`).
- Produces:
  - `resolveClientFolder_(name, tokenDriveId) → {folder}` — hybrid rule; records `folderId`/`folderSource` on the Clients tab.
  - `subFolder_(parent, name) → Folder` (get-or-create), `rootFolder_() → Folder` ("SHIFT Clients", honors `ROOT_FOLDER_ID`).
  - `logActivity_(client, type, detail, link)`, `notify_(subject, html)`, `escHtml_(s)`.
  - Wire protocol for `upload`: request `{action:'upload', token, filename, mimeType, dataB64, kind:'file'|'logo'|'monogram'|'avatar'}` → `{ok:true, fileId, fileUrl, thumbUrl}` (`thumbUrl` empty for non-images). Errors: `bad-file`, `too-big`.

- [ ] **Step 1: Write the failing tests**

Create `tests/backend-upload.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackend, makeToken } from './gs-harness.mjs';

const SECRET = 'test-secret';
const NOW = Math.floor(Date.now() / 1000);
const b64 = (s) => Buffer.from(s).toString('base64');

function boot() {
  const gs = loadBackend();
  gs._props.PORTAL_SECRET = SECRET;
  return gs;
}
const upload = (gs, over = {}) => gs.dispatch_({
  action: 'upload', token: makeToken(`Priya Raj|${NOW + 60}`, SECRET),
  filename: 'moodboard.png', mimeType: 'image/png', dataB64: b64('PNGDATA'), kind: 'file', ...over,
});

test('upload auto-creates SHIFT Clients/<name>/Uploads and records folder', () => {
  const gs = boot();
  const r = upload(gs);
  assert.equal(r.ok, true);
  assert.match(r.thumbUrl, /thumbnail\?id=/);
  const root = gs.DriveApp._root._folders.find((f) => f.getName() === 'SHIFT Clients');
  const clientFolder = root._folders.find((f) => f.getName() === 'Priya Raj');
  const uploads = clientFolder._folders.find((f) => f.getName() === 'Uploads');
  assert.equal(uploads._files[0].getName(), 'moodboard.png');
  const rec = gs.getClientRow_('Priya Raj');
  assert.equal(rec.folderSource, 'auto');
  assert.equal(rec.folderId, clientFolder.getId());
});

test('upload uses token driveId when present (manual folder)', () => {
  const gs = boot();
  const manual = gs.DriveApp.createFolder('Palwinder Drive');
  const r = gs.dispatch_({
    action: 'upload', token: makeToken(`Palwinder|${NOW + 60}|${manual.getId()}`, SECRET),
    filename: 'song list.pdf', mimeType: 'application/pdf', dataB64: b64('PDF'), kind: 'file',
  });
  assert.equal(r.ok, true);
  assert.equal(r.thumbUrl, '');
  assert.equal(manual._folders.find((f) => f.getName() === 'Uploads')._files[0].getName(), 'song list.pdf');
  assert.equal(gs.getClientRow_('Palwinder').folderSource, 'manual');
});

test('brand kinds go to Brand Assets, update profile pointer, share images', () => {
  const gs = boot();
  const r = upload(gs, { kind: 'monogram', filename: 'PR-monogram.svg', mimeType: 'image/svg+xml' });
  assert.equal(r.ok, true);
  assert.equal(gs.getClientRow_('Priya Raj').monogramFileId, r.fileId);
  assert.equal(gs.DriveApp._byId[r.fileId]._shared, true);
});

test('upload validates payload: empty and oversized rejected', () => {
  const gs = boot();
  assert.equal(upload(gs, { dataB64: '' }).error, 'bad-file');
  assert.equal(upload(gs, { dataB64: '!!!notbase64!!!' }).error, 'bad-file');
  const gs2 = boot();
  gs2.MAX_UPLOAD_BYTES = 4; // shrink cap for the test
  assert.equal(upload(gs2).error, 'too-big');
});

test('upload sends one notification email to configured recipients', () => {
  const gs = boot();
  gs._props.NOTIFY_EMAILS = 'a@x.mx,b@x.mx';
  upload(gs);
  assert.equal(gs._sentEmails.length, 1);
  assert.equal(gs._sentEmails[0].to, 'a@x.mx,b@x.mx');
  assert.match(gs._sentEmails[0].subject, /Priya Raj uploaded moodboard\.png/);
});

test('upload default recipients are ventas@ + Produccion@', () => {
  const gs = boot();
  upload(gs);
  assert.equal(gs._sentEmails[0].to, 'ventas@5hift.com.mx,Produccion@5hift.com.mx');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: Task 3 file FAILS (`uploadAction_ is not defined` surfaces as `{error:'server'}` → assertion failures); earlier tests PASS.

- [ ] **Step 3: Append upload + folders + notify to `apps-script/portal-backend.gs`**

```javascript
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

// Hybrid rule: recorded folder → token's manual folder → auto-create.
function resolveClientFolder_(name, tokenDriveId) {
  var rec = getClientRow_(name);
  if (rec && rec.folderId) {
    try { return { folder: DriveApp.getFolderById(rec.folderId) }; }
    catch (e) { /* folder was deleted — fall through and re-resolve */ }
  }
  if (tokenDriveId) {
    var f = DriveApp.getFolderById(tokenDriveId);
    upsertClient_(name, { folderId: tokenDriveId, folderSource: 'manual' });
    return { folder: f };
  }
  var created = rootFolder_().createFolder(name);
  upsertClient_(name, { folderId: created.getId(), folderSource: 'auto' });
  return { folder: created };
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

  var res = resolveClientFolder_(v.name, v.driveId);
  var sub = subFolder_(res.folder, kind === 'file' ? 'Uploads' : 'Brand Assets');
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
    '<a href="https://drive.google.com/drive/folders/' + res.folder.getId() + '">Client folder</a>'
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — all tests so far (20). If the `too-big` test fails: `MAX_UPLOAD_BYTES` must be declared with `var` (not `const`) so the vm sandbox override `gs2.MAX_UPLOAD_BYTES = 4` is visible to `uploadAction_` — with `var` in vm context both read the same global.

- [ ] **Step 5: Commit**

```bash
git add apps-script/portal-backend.gs tests/backend-upload.test.mjs
git commit -m "feat: portal backend upload — hybrid Drive folders + email notifications"
```

---

### Task 4: Backend `files.list`, notes thread, admin actions + SETUP.md

**Files:**
- Modify: `apps-script/portal-backend.gs` (append)
- Create: `apps-script/SETUP.md`
- Test: `tests/backend-notes-files.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces (wire protocol; portal/manager tasks depend on these exact shapes):
  - `files.list`: `{action, token}` → `{ok:true, files:[{id,name,size,date,folder,isImage,thumbUrl,url}]}` newest-first, max 100.
  - `notes.list`: `{action, token, proposalId}` → `{ok:true, notes:[{ts,author:'client'|'shift',text,proposalId}]}` oldest-first. `proposalId:'*'` returns ALL of the client's notes (portal uses this for count badges).
  - `notes.add`: `{action, token, proposalId, text}` → `{ok:true}`; empty text → `{ok:false,error:'empty'}`; sends notification email.
  - `admin.activity`: `{action, adminKey, limit?}` → `{ok:true, activity:[{ts,client,type,detail,link}], notes:[{ts,client,proposalId,author,text}]}` both newest-first.
  - `admin.reply`: `{action, adminKey, clientName, proposalId, text}` → `{ok:true}` (no email).

- [ ] **Step 1: Write the failing tests**

Create `tests/backend-notes-files.test.mjs`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackend, makeToken } from './gs-harness.mjs';

const SECRET = 'test-secret';
const NOW = Math.floor(Date.now() / 1000);
const tok = (name) => makeToken(`${name}|${NOW + 600}`, SECRET);
const b64 = (s) => Buffer.from(s).toString('base64');

function boot() {
  const gs = loadBackend();
  gs._props.PORTAL_SECRET = SECRET;
  gs._props.ADMIN_KEY = 'ak';
  return gs;
}

test('files.list returns uploads newest-first with metadata', () => {
  const gs = boot();
  gs.dispatch_({ action: 'upload', token: tok('Priya'), filename: 'a.png', mimeType: 'image/png', dataB64: b64('A'), kind: 'file' });
  gs.dispatch_({ action: 'upload', token: tok('Priya'), filename: 'deck.pdf', mimeType: 'application/pdf', dataB64: b64('B'), kind: 'file' });
  gs.dispatch_({ action: 'upload', token: tok('Priya'), filename: 'logo.png', mimeType: 'image/png', dataB64: b64('C'), kind: 'logo' });
  const r = gs.dispatch_({ action: 'files.list', token: tok('Priya') });
  assert.equal(r.ok, true);
  assert.equal(r.files.length, 3);
  const names = r.files.map((f) => f.name).sort();
  assert.deepEqual(names, ['a.png', 'deck.pdf', 'logo.png']);
  const img = r.files.find((f) => f.name === 'a.png');
  assert.equal(img.isImage, true);
  assert.equal(img.folder, 'Uploads');
  assert.match(img.thumbUrl, /thumbnail/);
  assert.equal(r.files.find((f) => f.name === 'logo.png').folder, 'Brand Assets');
});

test('files.list is empty for client with no folder', () => {
  const gs = boot();
  assert.deepEqual(gs.dispatch_({ action: 'files.list', token: tok('Nobody') }), { ok: true, files: [] });
});

test('notes round-trip: client adds, list filters by proposal, * returns all', () => {
  const gs = boot();
  gs.dispatch_({ action: 'notes.add', token: tok('Priya'), proposalId: 'WED2026.html', text: 'Add dhol player' });
  gs.dispatch_({ action: 'notes.add', token: tok('Priya'), proposalId: 'general', text: 'Guest count is 320' });
  gs.dispatch_({ action: 'notes.add', token: tok('Other'), proposalId: 'WED2026.html', text: 'not yours' });
  const one = gs.dispatch_({ action: 'notes.list', token: tok('Priya'), proposalId: 'WED2026.html' });
  assert.equal(one.notes.length, 1);
  assert.equal(one.notes[0].author, 'client');
  assert.equal(one.notes[0].text, 'Add dhol player');
  const all = gs.dispatch_({ action: 'notes.list', token: tok('Priya'), proposalId: '*' });
  assert.equal(all.notes.length, 2);
  assert.equal(all.notes[0].proposalId, 'WED2026.html'); // oldest first
});

test('notes.add rejects empty, notifies by email', () => {
  const gs = boot();
  assert.equal(gs.dispatch_({ action: 'notes.add', token: tok('Priya'), proposalId: 'general', text: '   ' }).error, 'empty');
  gs.dispatch_({ action: 'notes.add', token: tok('Priya'), proposalId: 'general', text: 'Hello <b>SHIFT</b>' });
  assert.equal(gs._sentEmails.length, 1);
  assert.match(gs._sentEmails[0].subject, /New note from Priya/);
  assert.match(gs._sentEmails[0].htmlBody, /&lt;b&gt;/); // client text is escaped
});

test('admin.reply lands in client thread; admin.activity aggregates', () => {
  const gs = boot();
  gs.dispatch_({ action: 'notes.add', token: tok('Priya'), proposalId: 'general', text: 'When is soundcheck?' });
  const rep = gs.dispatch_({ action: 'admin.reply', adminKey: 'ak', clientName: 'Priya', proposalId: 'general', text: '4pm on the day.' });
  assert.equal(rep.ok, true);
  const thread = gs.dispatch_({ action: 'notes.list', token: tok('Priya'), proposalId: 'general' });
  assert.deepEqual(thread.notes.map((n) => n.author), ['client', 'shift']);
  assert.equal(gs._sentEmails.length, 1); // client note emailed; admin reply sends NO email
  gs.dispatch_({ action: 'upload', token: tok('Priya'), filename: 'x.png', mimeType: 'image/png', dataB64: b64('X'), kind: 'file' });
  const act = gs.dispatch_({ action: 'admin.activity', adminKey: 'ak' });
  assert.equal(act.ok, true);
  assert.equal(act.activity[0].type, 'upload'); // newest first
  assert.equal(act.activity[1].type, 'note');
  assert.equal(act.notes.length, 2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/`
Expected: Task 4 file FAILS (`filesList_ is not defined` → `{error:'server'}`); earlier PASS.

- [ ] **Step 3: Append list/notes/admin actions to `apps-script/portal-backend.gs`**

```javascript
// ── Files listing ────────────────────────────────────────────

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/`
Expected: PASS — full suite (25 tests).

- [ ] **Step 5: Write `apps-script/SETUP.md`**

```markdown
# Portal Backend — One-Time Setup (~5 minutes)

The portal backend is a Google Apps Script that lives in YOUR Google account.
It writes uploads into your Drive, keeps notes in a Google Sheet, and emails
ventas@5hift.com.mx + Produccion@5hift.com.mx when clients act.

## 1. Create the script
1. Open https://script.new — **log in as Produccion@5hift.com.mx**. Everything portal-related (script, client Drive folders, data sheet, notification sender) lives in that account. SHIFT ≠ DJD: never use the desijunctiondjs account for any of this.
2. Name it **SHIFT Portal Backend** (click "Untitled project" top-left).
3. Delete the placeholder code, paste ALL of `apps-script/portal-backend.gs`, save (⌘S).

## 2. Set the secrets (Script Properties)
1. Left sidebar → ⚙️ **Project Settings** → scroll to **Script Properties** → *Add script property*:
   - `PORTAL_SECRET` → a long random string. Generate one in Terminal: `openssl rand -hex 24`
   - `ADMIN_KEY` → a DIFFERENT random string: `openssl rand -hex 24`
   - `NOTIFY_EMAILS` → `ventas@5hift.com.mx,Produccion@5hift.com.mx` (optional — this is already the default)
   - `ROOT_FOLDER_ID` → (optional) a Drive folder ID if you want auto-created client
     folders somewhere specific. Leave unset to use a "SHIFT Clients" folder at My Drive root.
2. Keep both random strings — you'll paste them into the manager in step 5.

## 3. Deploy as web app
1. Top-right **Deploy → New deployment**.
2. Type: **Web app**. Description: `v1`.
3. **Execute as: Me**. **Who has access: Anyone.** (Required — clients are not logged
   into Google. Security comes from the signed link tokens, not from Google login.)
4. Click Deploy → **Authorize access** → choose your account → Advanced → Allow.
5. Copy the **Web app URL** (ends in `/exec`).
6. Sanity check: open that URL in a browser tab — you should see
   `{"ok":true,"service":"SHIFT Portal Backend",...}`.

## 4. Bake the URL into the portal page
In `SHIFT_proposals_hub.html`, find `const BACKEND_URL =` (near the top) and replace
the placeholder with your `/exec` URL. Commit + push.

## 5. Configure the manager
Manager → **Settings → Client Portal Backend**:
- Backend URL → the `/exec` URL
- Admin Key → the `ADMIN_KEY` value
- Portal Signing Secret → the `PORTAL_SECRET` value
Click **Save Portal Settings**.

## 6. Regenerate client links
Rotating the secret kills every old portal link. Go to **Portal Links**, generate a
fresh link per active client, and send them out.

## Updating the backend later
After editing the script: **Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.**
The URL stays the same. (Just saving the file does NOT update the live web app.)

## Rotating keys
Generate new values, update the Script Property AND the manager Settings field,
then regenerate client links (for `PORTAL_SECRET`) — `ADMIN_KEY` rotation needs no link changes.
```

- [ ] **Step 6: Commit**

```bash
git add apps-script/portal-backend.gs apps-script/SETUP.md tests/backend-notes-files.test.mjs
git commit -m "feat: portal backend files/notes/admin actions + deploy guide"
```

---

### Task 5: Local mock backend + portal gate switches to server-side verify

**Files:**
- Create: `tests/mock-backend.mjs`
- Modify: `SHIFT_proposals_hub.html` (the `<script>` block at the top, lines ~8–115)

**Interfaces:**
- Consumes: wire protocol from Tasks 2–4.
- Produces:
  - Mock server: `node tests/mock-backend.mjs` → serves the SAME JSON protocol on `http://localhost:8787` with secret `mock-secret`, in-memory state, CORS `*`; prints a ready-to-open portal URL on startup.
  - Portal globals used by Tasks 6–8: `_token` (string), `_clientName` (string), `_profile` ({driveFolderId, avatarUrl, logoUrl, monogramUrl}), `_api(action, extra) → Promise<responseObject>`, `_toast(msg)`, `esc(s)`.
  - Hooks called at the end of a successful gate (define as EMPTY functions in this task; Tasks 6–8 fill them): `_renderIdentity()`, `_decorateNoteButtons()`, `_refreshFiles()`.

- [ ] **Step 1: Write the mock backend**

Create `tests/mock-backend.mjs`:

```javascript
// Local stand-in for the Apps Script backend. Same JSON protocol, in-memory state.
// Run: node tests/mock-backend.mjs   → prints a portal URL with a valid token.
import http from 'node:http';
import { createHmac } from 'node:crypto';

const PORT = 8787, SECRET = 'mock-secret', ADMIN_KEY = 'mock-admin';
const clients = {}; // name → {folderId, avatarUrl, logoUrl, monogramUrl, files:[]}
const notes = [];   // {ts, client, proposalId, author, text}
const activity = [];
let fileSeq = 0;

const hmac = (msg) => createHmac('sha256', SECRET).update(msg, 'utf8').digest('hex').slice(0, 32);

function verify(token) {
  try {
    const i = token.lastIndexOf('.');
    const payload = Buffer.from(token.slice(0, i), 'base64').toString('utf8');
    if (token.slice(i + 1) !== hmac(payload)) return { ok: false, error: 'invalid' };
    const [name, exp, driveId] = payload.split('|');
    if (Date.now() / 1000 > +exp) return { ok: false, error: 'expired' };
    return { ok: true, name, exp: +exp, driveId: driveId || '' };
  } catch { return { ok: false, error: 'invalid' }; }
}
const cli = (name) => (clients[name] ??= { folderId: 'MOCK-FOLDER', avatarUrl: '', logoUrl: '', monogramUrl: '', files: [] });

function dispatch(b) {
  if (b.action?.startsWith('admin.')) {
    if (b.adminKey !== ADMIN_KEY) return { ok: false, error: 'unauthorized' };
    if (b.action === 'admin.activity') return { ok: true, activity: [...activity].reverse(), notes: [...notes].reverse().map(n => ({ ts: n.ts, client: n.client, proposalId: n.proposalId, author: n.author, text: n.text })) };
    notes.push({ ts: new Date().toISOString(), client: b.clientName, proposalId: b.proposalId || 'general', author: 'shift', text: b.text });
    return { ok: true };
  }
  const v = verify(String(b.token || ''));
  if (!v.ok) return v;
  const c = cli(v.name);
  switch (b.action) {
    case 'verify':
      return { ok: true, clientName: v.name, exp: v.exp, profile: { driveFolderId: c.folderId, avatarUrl: c.avatarUrl, logoUrl: c.logoUrl, monogramUrl: c.monogramUrl } };
    case 'upload': {
      if (!b.dataB64) return { ok: false, error: 'bad-file' };
      const id = 'mock-f' + ++fileSeq;
      const isImage = /^image\//.test(b.mimeType || '');
      // For the mock, thumbUrl is a data: URL so previews render with no Drive.
      const thumbUrl = isImage ? `data:${b.mimeType};base64,${b.dataB64}` : '';
      c.files.unshift({ id, name: b.filename, size: Math.round(b.dataB64.length * 0.75), date: new Date().toISOString(), folder: b.kind === 'file' ? 'Uploads' : 'Brand Assets', isImage, thumbUrl, url: '#' + id });
      if (b.kind === 'avatar') c.avatarUrl = thumbUrl;
      if (b.kind === 'logo') c.logoUrl = thumbUrl;
      if (b.kind === 'monogram') c.monogramUrl = thumbUrl;
      activity.push({ ts: new Date().toISOString(), client: v.name, type: 'upload', detail: `${b.kind}: ${b.filename}`, link: '' });
      return { ok: true, fileId: id, fileUrl: '#' + id, thumbUrl };
    }
    case 'files.list': return { ok: true, files: c.files };
    case 'notes.list': return { ok: true, notes: notes.filter(n => n.client === v.name && (b.proposalId === '*' || n.proposalId === (b.proposalId || 'general'))).map(n => ({ ts: n.ts, proposalId: n.proposalId, author: n.author, text: n.text })) };
    case 'notes.add': {
      if (!String(b.text || '').trim()) return { ok: false, error: 'empty' };
      notes.push({ ts: new Date().toISOString(), client: v.name, proposalId: b.proposalId || 'general', author: 'client', text: b.text.trim() });
      activity.push({ ts: new Date().toISOString(), client: v.name, type: 'note', detail: `${b.proposalId || 'general'}: ${b.text.slice(0, 140)}`, link: '' });
      return { ok: true };
    }
    default: return { ok: false, error: 'unknown-action' };
  }
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') { res.end(JSON.stringify({ ok: true, service: 'mock' })); return; }
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => {
    let out;
    try { out = dispatch(JSON.parse(body)); } catch { out = { ok: false, error: 'bad-request' }; }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(out));
  });
}).listen(PORT, () => {
  const payload = `Palwinder Chamdal|${Math.floor(Date.now() / 1000) + 86400}`;
  const token = Buffer.from(payload, 'utf8').toString('base64') + '.' + hmac(payload);
  console.log(`Mock portal backend on http://localhost:${PORT}  (admin key: ${ADMIN_KEY})`);
  console.log(`\nOpen the portal locally:\nhttp://localhost:8080/SHIFT_proposals_hub.html?api=${encodeURIComponent('http://localhost:' + PORT)}&t=${encodeURIComponent(token)}\n`);
});
```

- [ ] **Step 2: Replace the portal gate script**

In `SHIFT_proposals_hub.html`, replace the ENTIRE first `<script>` block (from `const _SK = 'SHIFTportal#2026$key!xK9mPq3';` through `window.addEventListener('DOMContentLoaded', _gateCheck);` inclusive — keep `_filterCardsForClient` and `_renderFilesTab` exactly where they are inside it, unchanged) with:

```javascript
// Backend URL is baked in at deploy time (apps-script/SETUP.md §4).
// ?api= override works ONLY on localhost so tokens can never be exfiltrated
// by a crafted link in production.
const BACKEND_URL = 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE';
const _API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? (new URLSearchParams(location.search).get('api') || BACKEND_URL)
  : BACKEND_URL;

let _token = '', _clientName = '', _profile = {};

async function _api(action, extra) {
  const res = await fetch(_API, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action, token: _token }, extra || {}))
  });
  return res.json();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _toast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9998;background:#1b1c1c;border:1px solid rgba(255,255,255,.18);color:#e3e3e3;padding:12px 20px;font-size:13.5px;max-width:90vw;transition:opacity .3s;font-family:Inter,sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.style.opacity = '0'; }, 4200);
}

async function _gateCheck() {
  _token = new URLSearchParams(location.search).get('t') || '';
  if (!_token) { _deny('no-token'); return; }
  let r;
  try { r = await _api('verify'); }
  catch (e) { _deny('offline'); return; }
  if (!r.ok) { _deny(r.error === 'expired' ? 'expired' : 'invalid'); return; }
  _clientName = r.clientName;
  _profile = r.profile || {};
  document.getElementById('_gate').style.display = 'none';
  document.getElementById('_portal').style.display = 'block';
  const greet = document.getElementById('_client-greeting');
  if (greet && _clientName) greet.textContent = _clientName;
  const exp_el = document.getElementById('_link-expires');
  if (exp_el) exp_el.textContent = new Date(r.exp * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  _filterCardsForClient(_clientName);
  _renderFilesTab(_profile.driveFolderId);
  _renderIdentity();
  _decorateNoteButtons();
  _refreshFiles();
}

// Filled in by later portal features (identity, notes, upload center).
function _renderIdentity() {}
function _decorateNoteButtons() {}
function _refreshFiles() {}
```

Then keep the existing `_filterCardsForClient` function unchanged, and keep `_renderFilesTab` unchanged, and REPLACE the existing `_deny` with:

```javascript
function _deny(reason) {
  document.getElementById('_gate').style.display = 'flex';
  document.getElementById('_portal').style.display = 'none';
  const msg = {
    'expired': 'This link has expired. Please contact SHIFT to request a new one.',
    'no-token': 'This page requires a private access link. Please check your email from SHIFT.',
    'invalid': 'This link is not valid. Please use the link sent to you by SHIFT.',
    'offline': 'We couldn’t reach the SHIFT server. Check your connection and try again.',
    'error': 'Something went wrong verifying your access. Please try your link again.'
  };
  const el = document.getElementById('_gate-msg');
  if (el) el.textContent = msg[reason] || msg['error'];
  const retry = document.getElementById('_gate-retry');
  if (retry) retry.style.display = reason === 'offline' ? 'inline-flex' : 'none';
}
window.addEventListener('DOMContentLoaded', _gateCheck);
```

And in the gate markup (`<div id="_gate" …>`), directly BEFORE the `<a href="index.html"` line, add:

```html
  <button id="_gate-retry" onclick="_gateCheck()" style="display:none" class="font-body text-label-sm uppercase tracking-widest text-primary border border-primary px-7 py-3 hover:bg-primary hover:text-background transition-all">↻ Try Again</button>
```

- [ ] **Step 3: Verify locally**

```bash
cd ~/shift-website
node tests/mock-backend.mjs &      # prints the portal URL
python3 -m http.server 8080 &
```

Open the printed URL in a browser (or preview tooling). Expected:
- Portal unlocks, greeting shows "Palwinder Chamdal", both Indian Wedding proposal cards visible, other clients' cards hidden.
- Files tab shows the Drive block (mock folderId `MOCK-FOLDER`).
- Break it: same URL with `&api=` pointing at a dead port → gate shows the "couldn't reach" message WITH the ↻ Try Again button.
- Tamper the token (change one char) → "This link is not valid."
- Confirm the string `SHIFTportal#2026` no longer appears anywhere in `SHIFT_proposals_hub.html`: `grep -c 'SHIFTportal#2026' SHIFT_proposals_hub.html` → `0`.

- [ ] **Step 4: Commit**

```bash
git add SHIFT_proposals_hub.html tests/mock-backend.mjs
git commit -m "feat: portal gate verifies server-side — secret removed from public source"
```

---

### Task 6: Portal profile header (avatar) + brand assets strip

**Files:**
- Modify: `SHIFT_proposals_hub.html` (header markup + append to main script)

**Interfaces:**
- Consumes: `_api`, `_profile`, `_toast`, `esc`, `_renderIdentity` hook (Task 5).
- Produces: `_uploadFile(file, kind) → Promise<{fileId,thumbUrl,fileUrl}|null>` and `MAX_MB = 20` — Task 7 reuses both. Real `_renderIdentity()` implementation (replaces the empty stub — DELETE the stub from Task 5).

- [ ] **Step 1: Add avatar to the header**

In the PORTAL HEADER section, replace:

```html
    <h1 class="font-display font-bold text-primary mb-2" style="font-size:clamp(36px,6vw,72px);line-height:1;letter-spacing:-0.02em;">
      Welcome back, <span id="_client-greeting" class="text-on-surface-variant">—</span>
    </h1>
```

with:

```html
    <div class="flex items-end gap-5 flex-wrap">
      <button id="pf-avatar" onclick="document.getElementById('pf-avatar-input').click()" title="Add / change your profile photo"
        class="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-all font-display font-semibold text-xl text-on-surface-variant flex items-center justify-center bg-surface-container-low relative group">
        <span id="pf-avatar-content">—</span>
        <span class="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/60 text-primary material-symbols-outlined text-xl">photo_camera</span>
      </button>
      <input id="pf-avatar-input" type="file" accept="image/*" style="display:none" onchange="_avatarPicked(this)"/>
      <h1 class="font-display font-bold text-primary mb-2" style="font-size:clamp(36px,6vw,72px);line-height:1;letter-spacing:-0.02em;">
        Welcome back, <span id="_client-greeting" class="text-on-surface-variant">—</span>
      </h1>
    </div>
```

- [ ] **Step 2: Add the brand assets strip**

Directly AFTER the closing `</header>` of the portal header and BEFORE `<!-- TABS -->`, insert:

```html
<!-- BRAND ASSETS -->
<section aria-label="Your brand assets" class="px-gm py-8 border-b border-outline-variant/20">
  <div class="max-w-5xl mx-auto">
    <p class="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-4">Your Brand Assets — logo &amp; monogram for your event design</p>
    <div class="flex gap-4 flex-wrap">
      <div id="brand-logo" class="brand-slot"></div>
      <div id="brand-monogram" class="brand-slot"></div>
    </div>
    <input id="brand-input" type="file" accept="image/*" style="display:none"/>
  </div>
</section>
```

And add to the page's `<style>` block (there is one after the Tailwind config script):

```css
.brand-slot{width:200px;min-height:120px;border:1px dashed rgba(255,255,255,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;cursor:pointer;transition:border-color .2s,background .2s}
.brand-slot:hover{border-color:#c8f75a;background:rgba(255,255,255,.03)}
.brand-slot img{max-width:100%;max-height:96px;object-fit:contain}
.brand-slot .brand-label{font-family:Inter,sans-serif;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8f9192}
```

(`#c8f75a` — use the page's actual `primary` color from the Tailwind config; check `tailwind.config` at the top of the file and use that hex.)

- [ ] **Step 3: Add the identity/upload JS**

Append to the portal's main `<script>` (the one containing `switchTab`), and DELETE the three empty stubs `_renderIdentity/_decorateNoteButtons/_refreshFiles` from Task 5 as each real implementation lands (this task: `_renderIdentity`):

```javascript
// ── Identity: avatar + brand assets ─────────────────────────
const MAX_MB = 20;

function _initials(name) {
  return (name || '').split(/\s+/).slice(0, 2).map((w) => (w[0] || '')).join('').toUpperCase() || '—';
}

function _fileToB64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function _uploadFile(file, kind) {
  if (file.size > MAX_MB * 1024 * 1024) {
    _toast(`“${file.name}” is over ${MAX_MB} MB — for big files use the Drive folder in the Files tab.`);
    return null;
  }
  const dataB64 = await _fileToB64(file);
  let r;
  try {
    r = await _api('upload', { filename: file.name, mimeType: file.type || 'application/octet-stream', dataB64, kind });
  } catch (e) {
    _toast('Upload failed — check your connection and try again.');
    return null;
  }
  if (!r.ok) {
    _toast(r.error === 'too-big'
      ? `“${file.name}” is too large — use the Drive folder in the Files tab.`
      : 'Upload failed — please try again.');
    return null;
  }
  return r;
}

function _renderIdentity() {
  const av = document.getElementById('pf-avatar-content');
  if (av) {
    av.parentElement.querySelectorAll('img').forEach((i) => i.remove());
    if (_profile.avatarUrl) {
      av.textContent = '';
      const img = document.createElement('img');
      img.src = _profile.avatarUrl;
      img.alt = '';
      img.className = 'absolute inset-0 w-full h-full object-cover';
      av.parentElement.prepend(img);
    } else {
      av.textContent = _initials(_clientName);
    }
  }
  _renderBrandSlot('logo', 'Logo', _profile.logoUrl);
  _renderBrandSlot('monogram', 'Monogram', _profile.monogramUrl);
}

function _renderBrandSlot(kind, label, url) {
  const box = document.getElementById('brand-' + kind);
  if (!box) return;
  box.innerHTML = url
    ? `<img src="${esc(url)}" alt="${esc(label)}"/><span class="brand-label">${label} · tap to replace</span>`
    : `<span class="material-symbols-outlined" style="color:#8f9192">add_photo_alternate</span><span class="brand-label">Add your ${label}</span>`;
  box.onclick = () => _brandPick(kind);
}

function _brandPick(kind) {
  const input = document.getElementById('brand-input');
  input.onchange = async () => {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { _toast('Please choose an image file (PNG, JPG, SVG).'); return; }
    _toast('Uploading ' + file.name + '…');
    const r = await _uploadFile(file, kind);
    if (!r) return;
    _profile[kind + 'Url'] = r.thumbUrl;
    _renderIdentity();
    _toast((kind === 'logo' ? 'Logo' : 'Monogram') + ' saved — SHIFT has been notified. ✓');
  };
  input.click();
}

async function _avatarPicked(input) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) { _toast('Please choose an image file.'); return; }
  _toast('Uploading photo…');
  const r = await _uploadFile(file, 'avatar');
  if (!r) return;
  _profile.avatarUrl = r.thumbUrl;
  _renderIdentity();
  _toast('Profile photo saved ✓');
}
```

- [ ] **Step 4: Verify locally**

With the mock backend + static server from Task 5 still running, reload the printed portal URL. Expected:
- Header shows a circular avatar with initials "PC"; hovering shows the camera overlay.
- Clicking the avatar → file picker → choosing a PNG shows "Uploading…" then the image fills the circle; reloading the page keeps it (mock stores it).
- Brand strip shows two dashed slots ("Add your Logo" / "Add your Monogram"); uploading an image into each renders the preview with "tap to replace".
- Choosing a `.pdf` for a brand slot → toast "Please choose an image file…", nothing uploads.
- Mobile: at 375 px width the avatar + heading wrap cleanly, brand slots stack.

- [ ] **Step 5: Commit**

```bash
git add SHIFT_proposals_hub.html
git commit -m "feat: portal profile avatar + logo/monogram brand asset slots"
```

---

### Task 7: Portal Files tab → upload center + gallery

**Files:**
- Modify: `SHIFT_proposals_hub.html` (`#tab-files` markup + append JS)

**Interfaces:**
- Consumes: `_uploadFile` (Task 6), `_api`, `esc`, `_toast`; backend `files.list` shape (Task 4). Real `_refreshFiles()` replaces the Task 5 stub.
- Produces: nothing used by later tasks.

- [ ] **Step 1: Add the upload center markup**

Inside `<div id="tab-files" class="tab-panel">`, directly after the `<div class="mb-8">…</div>` heading block, insert:

```html
    <!-- UPLOAD CENTER -->
    <div id="upload-zone" class="border border-dashed border-outline-variant/60 p-10 text-center cursor-pointer transition-all hover:border-primary mb-4"
         onclick="document.getElementById('upload-input').click()">
      <span class="material-symbols-outlined text-primary text-3xl mb-2 inline-block">cloud_upload</span>
      <p class="font-body text-primary mb-1">Drag &amp; drop files here, or tap to choose</p>
      <p class="font-body text-sm text-on-surface-variant">Contracts, music, photos, layouts — anything up to 20 MB per file. It lands straight in your SHIFT project folder.</p>
    </div>
    <input id="upload-input" type="file" multiple style="display:none" onchange="_filesPicked(this.files); this.value='';"/>
    <div id="upload-progress" class="mb-6"></div>

    <div class="mb-10">
      <p class="font-body text-label-sm uppercase tracking-widest text-on-surface-variant mb-4">Your Uploaded Files</p>
      <div id="files-gallery" class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>
      <p id="files-empty" class="font-body text-sm text-on-surface-variant" style="display:none">Nothing uploaded yet — your files will appear here.</p>
    </div>
```

Also, in the existing `files-drive` block, change the `<a id="files-open-link">` button label from `Open Folder / Upload Files` to `Open Full Drive Folder` (uploads now happen above; the Drive folder is the path for >20 MB files) and in the paragraph below it replace the sentence starting `Click the button above` with: `Use the uploader above for most files. For very large files (over 20 MB — long videos, raw footage), open the folder and drag them in directly.`

- [ ] **Step 2: Add the upload center JS**

Append to the main script (and delete the `_refreshFiles` stub):

```javascript
// ── Files tab: upload center + gallery ──────────────────────
function _fmtSize(b) {
  if (!b && b !== 0) return '';
  if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

async function _refreshFiles() {
  const gal = document.getElementById('files-gallery');
  const empty = document.getElementById('files-empty');
  if (!gal) return;
  let r;
  try { r = await _api('files.list'); } catch (e) { return; }
  if (!r.ok) return;
  gal.innerHTML = r.files.map((f) => `
    <a href="${esc(f.url)}" target="_blank" rel="noopener" class="border border-outline-variant/40 p-3 flex flex-col gap-2 hover:border-primary transition-all" style="text-decoration:none">
      ${f.isImage && f.thumbUrl
        ? `<img src="${esc(f.thumbUrl)}" alt="" loading="lazy" style="width:100%;height:90px;object-fit:cover">`
        : `<div style="height:90px" class="flex items-center justify-center"><span class="material-symbols-outlined text-on-surface-variant text-3xl">description</span></div>`}
      <span class="font-body text-xs text-primary" style="word-break:break-all">${esc(f.name)}</span>
      <span class="font-body text-[10px] uppercase tracking-widest text-on-surface-variant">${_fmtSize(f.size)} · ${new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    </a>`).join('');
  empty.style.display = r.files.length ? 'none' : 'block';
}

async function _filesPicked(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  const prog = document.getElementById('upload-progress');
  for (const file of files) {
    const row = document.createElement('div');
    row.className = 'font-body text-sm text-on-surface-variant py-1';
    row.textContent = `Uploading ${file.name}…`;
    prog.appendChild(row);
    const r = await _uploadFile(file, 'file');
    row.textContent = r ? `✓ ${file.name} uploaded` : `✗ ${file.name} failed`;
    row.style.color = r ? '' : '#ff6b6b';
    setTimeout(() => row.remove(), 6000);
  }
  _refreshFiles();
}

// Drag & drop
(() => {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  ['dragover', 'dragenter'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('border-primary'); }));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('border-primary'); }));
  zone.addEventListener('drop', (e) => _filesPicked(e.dataTransfer.files));
})();
```

- [ ] **Step 3: Verify locally**

Reload the mock portal URL, open the Files tab. Expected:
- Drop zone renders; dropping two files shows two "Uploading…" rows → "✓ uploaded" → both appear in the gallery (image shows thumbnail, PDF shows document icon, size + date correct).
- Files uploaded in Task 6 (logo/monogram/avatar) also appear, tagged from Brand Assets.
- A file > 20 MB (create one: `mkfile 21m /tmp/big.bin` on macOS) → toast about the Drive folder, no upload row stays.
- Empty state: fresh mock restart → "Nothing uploaded yet…" until first upload.
- Drive block below now reads "Open Full Drive Folder".

- [ ] **Step 4: Commit**

```bash
git add SHIFT_proposals_hub.html
git commit -m "feat: portal upload center with drag-and-drop + uploaded-files gallery"
```

---

### Task 8: Portal notes threads (proposal slide-over + general event info)

**Files:**
- Modify: `SHIFT_proposals_hub.html` (markup + append JS)

**Interfaces:**
- Consumes: `_api`, `esc`, `_toast`; backend `notes.list`/`notes.add` (Task 4). Real `_decorateNoteButtons()` replaces the Task 5 stub.
- Produces: nothing used by later tasks.

- [ ] **Step 1: Add the slide-over markup**

Directly before the closing `</div>` of `<div id="_portal">` (search for the last `</main>` and insert after it, still inside `_portal`):

```html
<!-- NOTES SLIDE-OVER -->
<div id="notes-overlay" onclick="_closeNotes()" style="display:none;position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.55)"></div>
<aside id="notes-panel" aria-label="Notes" style="display:none;position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:9991;background:#0d0e0f;border-left:1px solid rgba(255,255,255,.14);flex-direction:column">
  <div class="flex items-center justify-between p-5 border-b border-outline-variant/30">
    <div>
      <p class="font-body text-label-sm uppercase tracking-widest text-on-surface-variant">Notes &amp; Requests</p>
      <p id="notes-title" class="font-display font-semibold text-primary text-lg tracking-tight"></p>
    </div>
    <button onclick="_closeNotes()" class="text-on-surface-variant hover:text-primary transition-colors text-xl px-2" aria-label="Close">✕</button>
  </div>
  <div id="notes-thread" class="flex-1 overflow-y-auto p-5 flex flex-col gap-3"></div>
  <div class="p-5 border-t border-outline-variant/30">
    <textarea id="notes-input" rows="3" placeholder="Write a note, request, or extra info for SHIFT…"
      class="w-full bg-background border border-outline-variant/50 text-primary font-body text-sm p-3 focus:border-primary outline-none resize-none"></textarea>
    <button id="notes-send" onclick="_sendNote()"
      class="mt-2 w-full font-body text-label-sm uppercase tracking-widest border border-primary text-primary px-5 py-3 hover:bg-primary hover:text-background transition-all">Send to SHIFT</button>
  </div>
</aside>
```

And in the PORTAL HEADER, directly after the `<p class="font-body text-on-surface-variant mt-3">Your SHIFT project hub …</p>` line, add:

```html
    <button onclick="_openNotes('general','Event Info & Requests')"
      class="mt-6 font-body text-label-sm uppercase tracking-widest border border-outline-variant text-on-surface-variant px-6 py-3 hover:border-primary hover:text-primary transition-all inline-flex items-center gap-2">
      <span class="material-symbols-outlined text-base">forum</span> Event Info &amp; Requests
      <span id="general-notes-badge" class="text-primary" style="display:none"></span>
    </button>
```

- [ ] **Step 2: Add the notes JS**

Append to the main script (and delete the `_decorateNoteButtons` stub):

```javascript
// ── Notes threads ────────────────────────────────────────────
let _notesPid = '', _noteCounts = {};

async function _decorateNoteButtons() {
  // Count badges: one call for all of this client's notes.
  try {
    const all = await _api('notes.list', { proposalId: '*' });
    if (all.ok) {
      _noteCounts = {};
      all.notes.forEach((n) => { _noteCounts[n.proposalId] = (_noteCounts[n.proposalId] || 0) + 1; });
    }
  } catch (e) { /* badges are cosmetic — portal still works */ }

  document.querySelectorAll('.proposal-card[onclick]').forEach((card) => {
    if (card.querySelector('.notes-chip') || card.style.display === 'none') return;
    const m = (card.getAttribute('onclick') || '').match(/openProposal\('([^']+)','([^']*)'/);
    if (!m) return;
    const [, pid, title] = m;
    const chip = document.createElement('button');
    chip.className = 'notes-chip font-body text-[10px] uppercase tracking-widest text-on-surface-variant border border-outline-variant/50 px-3 py-2 mt-4 self-start hover:border-primary hover:text-primary transition-all inline-flex items-center gap-1.5';
    chip.innerHTML = `<span class="material-symbols-outlined text-sm">chat_bubble</span> Notes${_noteCounts[pid] ? ` (${_noteCounts[pid]})` : ''}`;
    chip.onclick = (e) => { e.stopPropagation(); _openNotes(pid, title); };
    card.appendChild(chip);
  });

  const badge = document.getElementById('general-notes-badge');
  if (badge && _noteCounts['general']) {
    badge.textContent = `(${_noteCounts['general']})`;
    badge.style.display = 'inline';
  }
}

async function _openNotes(pid, title) {
  _notesPid = pid;
  document.getElementById('notes-title').textContent = title || pid;
  document.getElementById('notes-overlay').style.display = 'block';
  document.getElementById('notes-panel').style.display = 'flex';
  const thread = document.getElementById('notes-thread');
  thread.innerHTML = '<p class="font-body text-sm text-on-surface-variant">Loading…</p>';
  let r;
  try { r = await _api('notes.list', { proposalId: pid }); }
  catch (e) { thread.innerHTML = '<p class="font-body text-sm text-on-surface-variant">Couldn’t load notes — close and try again.</p>'; return; }
  _renderThread(r.ok ? r.notes : []);
}

function _renderThread(notes) {
  const thread = document.getElementById('notes-thread');
  thread.innerHTML = notes.length ? notes.map((n) => `
    <div class="max-w-[85%] ${n.author === 'client' ? 'self-end' : 'self-start'}">
      <div class="font-body text-sm leading-relaxed p-3 ${n.author === 'client'
        ? 'bg-surface-container-low text-primary border border-outline-variant/30'
        : 'border border-primary/40 text-primary'}">${esc(n.text).replace(/\n/g, '<br>')}</div>
      <p class="font-body text-[10px] uppercase tracking-widest text-on-surface-variant mt-1 ${n.author === 'client' ? 'text-right' : ''}">
        ${n.author === 'client' ? 'You' : 'SHIFT'} · ${new Date(n.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
    </div>`).join('')
    : '<p class="font-body text-sm text-on-surface-variant">No notes yet — anything you write here goes straight to the SHIFT team.</p>';
  thread.scrollTop = thread.scrollHeight;
}

function _closeNotes() {
  document.getElementById('notes-overlay').style.display = 'none';
  document.getElementById('notes-panel').style.display = 'none';
}

async function _sendNote() {
  const input = document.getElementById('notes-input');
  const btn = document.getElementById('notes-send');
  const text = input.value.trim();
  if (!text) return;
  btn.disabled = true;
  btn.textContent = 'Sending…';
  let r;
  try { r = await _api('notes.add', { proposalId: _notesPid, text }); }
  catch (e) { r = { ok: false }; }
  btn.disabled = false;
  btn.textContent = 'Send to SHIFT';
  if (!r.ok) { _toast('Couldn’t send — please try again.'); return; }
  input.value = '';
  const list = await _api('notes.list', { proposalId: _notesPid });
  _renderThread(list.ok ? list.notes : []);
  _toast('Sent — the SHIFT team has been notified ✓');
}
```

Note: `.proposal-card` needs `display:flex;flex-direction:column` for `self-start` on the chip — the cards already use `flex flex-col` classes, so the chip aligns left below content.

- [ ] **Step 3: Verify locally**

Reload the mock portal URL. Expected:
- Each visible proposal card shows a "Notes" chip; clicking it opens the slide-over WITHOUT navigating to the proposal (stopPropagation works).
- Sending "Add dhol player at entrance" renders it right-aligned as "You"; reopening keeps it; the chip badge shows "(1)" after reload.
- "Event Info & Requests" button in the header opens the general thread.
- Reply flow: `curl -s -X POST http://localhost:8787 -d '{"action":"admin.reply","adminKey":"mock-admin","clientName":"Palwinder Chamdal","proposalId":"general","text":"Got it — noted!"}'` → reopen the general thread → reply appears left-aligned as "SHIFT".
- Empty textarea + Send → nothing happens. Escape hatch: clicking the dark overlay closes the panel.
- Mobile 375 px: panel covers full width, textarea and buttons usable.

- [ ] **Step 4: Commit**

```bash
git add SHIFT_proposals_hub.html
git commit -m "feat: portal two-way notes threads on proposals + general event info"
```

---

### Task 9: Manager — portal backend settings + secret out of source

**Files:**
- Modify: `manager_v2.html` (Settings tab markup, `const _SK` line, `_hmac`, `generateLink`, `openPortal`)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - localStorage keys: `shift-portal-backend-url`, `shift-portal-admin-key`, `shift-portal-secret`.
  - `_portalSecret() → string`, `portalApi_(action, body) → Promise<responseObject|null>` (Task 10 uses `portalApi_`).

- [ ] **Step 1: Add the Settings block**

In `manager_v2.html`, directly BEFORE the `<div class="settings-block">` containing `<div class="settings-block-label">Invoice Defaults</div>`, insert:

```html
      <div class="settings-block">
        <div class="settings-block-label">Client Portal Backend</div>
        <p class="settings-hint" style="margin-top:0;margin-bottom:14px">
          The Apps Script that powers client uploads, notes and notifications.
          Setup guide: <code>apps-script/SETUP.md</code> in the repo.
        </p>
        <label class="f-label" style="margin-bottom:7px">Backend URL (ends in /exec)</label>
        <input class="f-input" id="portal-backend-url" placeholder="https://script.google.com/macros/s/…/exec"/>
        <label class="f-label" style="margin-top:12px;margin-bottom:7px">Admin Key</label>
        <input class="f-input" type="password" id="portal-admin-key" placeholder="ADMIN_KEY from Script Properties"/>
        <label class="f-label" style="margin-top:12px;margin-bottom:7px">Portal Signing Secret</label>
        <input class="f-input" type="password" id="portal-secret" placeholder="PORTAL_SECRET from Script Properties"/>
        <div class="settings-hint">The signing secret is stored in this browser only — it is never committed to the site. Portal links are signed with it, and the backend verifies with the same value.</div>
        <button class="save-btn" onclick="savePortalSettings()">Save Portal Settings</button>
        <div class="token-status" id="portal-settings-status"></div>
      </div>
```

- [ ] **Step 2: Replace the hardcoded secret**

Replace the line `const _SK = 'SHIFTportal#2026$key!xK9mPq3';` with:

```javascript
// Portal signing secret lives in Settings → localStorage — never in this file.
function _portalSecret() { return localStorage.getItem('shift-portal-secret') || ''; }
```

In `_hmac`, replace `new TextEncoder().encode(_SK)` with `new TextEncoder().encode(_portalSecret())`.

At the top of `generateLink()`, after the `if (!name)` guard, add:

```javascript
  if (!_portalSecret()) { toast('Set the Portal Signing Secret in Settings first', 'err'); switchTab('settings'); return; }
```

At the top of `openPortal()`, add:

```javascript
  if (!_portalSecret()) { toast('Set the Portal Signing Secret in Settings first', 'err'); switchTab('settings'); return; }
```

- [ ] **Step 3: Add save/load + API helper JS**

Near the other settings functions (e.g. right after `changePW()`), add:

```javascript
// ── Client Portal Backend settings ──────────────────────────
function savePortalSettings() {
  localStorage.setItem('shift-portal-backend-url', document.getElementById('portal-backend-url').value.trim());
  localStorage.setItem('shift-portal-admin-key', document.getElementById('portal-admin-key').value.trim());
  localStorage.setItem('shift-portal-secret', document.getElementById('portal-secret').value.trim());
  const st = document.getElementById('portal-settings-status');
  st.textContent = '✓ Saved (this browser only)';
  setTimeout(() => { st.textContent = ''; }, 3000);
}
function loadPortalSettings() {
  const g = (k) => localStorage.getItem(k) || '';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('portal-backend-url', g('shift-portal-backend-url'));
  set('portal-admin-key', g('shift-portal-admin-key'));
  set('portal-secret', g('shift-portal-secret'));
}

async function portalApi_(action, body) {
  const url = localStorage.getItem('shift-portal-backend-url');
  const key = localStorage.getItem('shift-portal-admin-key');
  if (!url || !key) { toast('Set Portal Backend URL + Admin Key in Settings', 'err'); return null; }
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(Object.assign({ action, adminKey: key }, body || {})) });
    return await res.json();
  } catch (e) {
    toast('Portal backend unreachable', 'err');
    return null;
  }
}
```

Find where the manager runs its init-on-load code (search for how existing settings like `default-payment-terms` get loaded, e.g. the `DOMContentLoaded` handler or init function that calls `renderHistory()`), and add a `loadPortalSettings();` call there.

- [ ] **Step 4: Verify locally**

Serve locally (`python3 -m http.server 8080`), open `http://localhost:8080/manager_v2.html`, log in. Expected:
- Settings shows the new block; entering values + Save → "✓ Saved"; reload → values persist.
- With the secret field EMPTY (clear it, save): Portal Links → Generate → error toast + jump to Settings. "View Portal ↗" → same toast.
- With a secret set: Generate Link works; open the link against the mock backend — NOTE the mock uses secret `mock-secret`, so set the manager's signing secret to `mock-secret` and backend URL to `http://localhost:8787` for the E2E: generated link + `&api=http%3A%2F%2Flocalhost%3A8787` opens the portal successfully. This proves manager-signed tokens verify server-side.
- `grep -c 'SHIFTportal#2026' manager_v2.html` → `0`.

- [ ] **Step 5: Commit**

```bash
git add manager_v2.html
git commit -m "feat: manager portal-backend settings — signing secret moved out of source"
```

---

### Task 10: Manager activity feed + note replies; final E2E + mobile pass

**Files:**
- Modify: `manager_v2.html` (Portal Links tab markup + JS)

**Interfaces:**
- Consumes: `portalApi_` (Task 9); `admin.activity`/`admin.reply` shapes (Task 4); `esc()` (already exists in manager — verify with `grep -n "function esc" manager_v2.html`, it's used by `renderHistory`).
- Produces: final feature — nothing downstream.

- [ ] **Step 1: Add the activity feed markup**

In the Portal Links tab (search `<div class="link-h2">Generate Portal Link</div>`), the tab contains the generator and a history list. AFTER the history list container (`id="history-list"` and its wrapper), add:

```html
      <div class="link-h2" style="margin-top:36px;display:flex;align-items:center;justify-content:space-between">
        Portal Activity
        <button class="open-portal-btn" onclick="loadPortalActivity()">↻ Refresh</button>
      </div>
      <div id="portal-activity"><div class="history-empty">Click Refresh to load client uploads &amp; notes.</div></div>
```

- [ ] **Step 2: Add the feed + reply JS**

Append near `portalApi_`:

```javascript
// ── Portal activity feed + note replies ─────────────────────
async function loadPortalActivity() {
  const box = document.getElementById('portal-activity');
  box.innerHTML = '<div class="history-empty">Loading…</div>';
  const r = await portalApi_('admin.activity', { limit: 50 });
  if (!r) { box.innerHTML = '<div class="history-empty">Backend not configured or unreachable.</div>'; return; }
  if (!r.ok) { box.innerHTML = `<div class="history-empty">Error: ${esc(r.error)}</div>`; return; }

  const acts = r.activity.map((a) => `
    <div class="hist-item">
      <div>
        <div class="hist-name">${a.type === 'upload' ? '📁' : '💬'} ${esc(a.client)} <span style="color:var(--dim);font-weight:400">· ${esc(a.detail)}</span></div>
        <div class="hist-meta">${new Date(a.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
      </div>
      <div class="hist-actions">
        ${a.link ? `<a class="hist-copy" href="${esc(a.link)}" target="_blank" rel="noopener" style="text-decoration:none">Open ↗</a>` : ''}
      </div>
    </div>`).join('');

  // Latest client notes with inline reply
  const clientNotes = r.notes.filter((n) => n.author === 'client').slice(0, 10);
  const noteRows = clientNotes.map((n, i) => `
    <div class="hist-item" style="flex-wrap:wrap;gap:10px">
      <div style="flex:1;min-width:220px">
        <div class="hist-name">${esc(n.client)} <span style="color:var(--dim);font-weight:400">on ${esc(n.proposalId)}</span></div>
        <div class="hist-meta" style="white-space:normal;color:var(--gray)">${esc(n.text)}</div>
      </div>
      <div style="display:flex;gap:8px;width:100%">
        <input class="f-input" id="pa-reply-${i}" placeholder="Reply to ${esc(n.client)}…" style="flex:1"/>
        <button class="hist-copy" onclick="sendPortalReply(${i}, '${esc(n.client).replace(/'/g, "\\'")}', '${esc(n.proposalId).replace(/'/g, "\\'")}')">Reply</button>
      </div>
    </div>`).join('');

  box.innerHTML =
    (acts || '<div class="history-empty">No activity yet.</div>') +
    (noteRows ? `<div class="link-h2" style="margin-top:24px">Latest Client Notes</div>${noteRows}` : '');
}

async function sendPortalReply(i, client, proposalId) {
  const input = document.getElementById(`pa-reply-${i}`);
  const text = input.value.trim();
  if (!text) return;
  const r = await portalApi_('admin.reply', { clientName: client, proposalId, text });
  if (r && r.ok) { input.value = ''; toast('Reply sent — visible in the client portal'); }
  else toast('Reply failed', 'err');
}
```

- [ ] **Step 3: Full local E2E (mock backend)**

With mock backend + static server running, manager configured with URL `http://localhost:8787`, admin key `mock-admin`, secret `mock-secret`:

1. Manager → Portal Links → Generate for "Palwinder Chamdal" → open link with `&api=http%3A%2F%2Flocalhost%3A8787` appended.
2. Portal: upload 2 files, set logo + monogram + avatar, write a note on a proposal and one in Event Info.
3. Manager → Portal Links → Refresh activity → all 5 uploads + 2 notes listed newest-first; note rows show reply boxes.
4. Reply to the proposal note → portal (reload) → Notes chip shows count, thread shows SHIFT reply left-aligned.
5. Backend unit suite still green: `node --test tests/` → all pass.

- [ ] **Step 4: Responsive + visual pass**

Check portal at 375 px and 1440 px (and manager at 1440 px): no horizontal overflow on any tab; avatar/brand strip/upload zone/notes panel usable at 375 px; gate states render centered. Fix any overflow with wrapping (`flex-wrap`) — do not introduce horizontal scroll.

- [ ] **Step 5: Commit**

```bash
git add manager_v2.html
git commit -m "feat: manager portal activity feed with inline note replies"
```

- [ ] **Step 6: Deployment note for Edwin (do NOT push in this plan)**

Everything after this is Edwin-in-the-loop, documented in `apps-script/SETUP.md`: deploy the Apps Script, paste the `/exec` URL into `SHIFT_proposals_hub.html` (`BACKEND_URL`), configure manager Settings, `git push`, regenerate + resend client links, then run the live checks from spec §7 (real Drive folder creation, real emails at both addresses, thumbnails on a second device).

---

## Self-Review Results

- **Spec coverage:** hybrid folders (T3), uploads+cap (T3/T6/T7), brand assets+avatar (T6), two-way notes+general thread (T4/T8/T10), email notifications to both addresses (T3/T4), server-side verify + secret rotation (T2/T5/T9), manager settings+activity (T9/T10), error states incl. offline retry (T5), mobile pass (T10), SETUP guide (T4). Deviation from spec, intentional and flagged in Global Constraints: the manager stores the signing secret in localStorage instead of embedding it (spec listed embedding as accepted-for-v1; storing is same effort, strictly safer).
- **Type consistency:** wire shapes defined once in Task 2/4 "Produces" and consumed verbatim in Tasks 5–10 (`profile.driveFolderId/avatarUrl/logoUrl/monogramUrl`, `files[].{id,name,size,date,folder,isImage,thumbUrl,url}`, `notes[].{ts,proposalId,author,text}`, activity `{ts,client,type,detail,link}`). `kind` enum `file|logo|monogram|avatar` used identically in T3 backend, T6/T7 portal, mock.
- **Placeholder scan:** the only literal placeholder is `BACKEND_URL = 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE'` — intentional, resolved by Edwin at deploy time per SETUP.md §4.
