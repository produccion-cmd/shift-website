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
  assert.equal(r.files[0].name, 'logo.png'); // uploaded last → newest first
  const dates = r.files.map((f) => f.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
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
