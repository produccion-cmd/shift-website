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
  // node:vm sandboxes are a separate JS realm: objects returned by .gs functions have a foreign Object.prototype,
  // which breaks assert.deepEqual. JSON round-trip re-creates them in this realm. Caveat: undefined-valued fields
  // are dropped — fine for this backend, which never returns undefined fields.
  // Skip normalization for objects with methods (GAS service objects like PropertiesService results).
  const normalize = (v) => {
    if (!v || typeof v !== 'object') return v;
    if (Object.getOwnPropertyNames(v).some(k => typeof v[k] === 'function')) return v;
    return JSON.parse(JSON.stringify(v));
  };
  for (const key of Object.keys(sandbox)) {
    if (typeof sandbox[key] === 'function' && key.endsWith('_')) {
      const original = sandbox[key];
      sandbox[key] = function(...args) {
        return normalize(original.apply(this, args));
      };
    }
  }
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
