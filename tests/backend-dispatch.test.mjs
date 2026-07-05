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
