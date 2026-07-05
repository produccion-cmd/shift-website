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
