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
