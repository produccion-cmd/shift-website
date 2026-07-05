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
  assert.equal(gs.sanitizeFilename_('logo\nfile.png'), 'logofile.png');
  assert.equal(gs.sanitizeFilename_(''), 'file');
  assert.equal(gs.sanitizeFilename_('a'.repeat(200)).length, 120);
});

test('isImageMime_ and thumbUrl_', () => {
  const gs = loadBackend();
  assert.equal(gs.isImageMime_('image/png'), true);
  assert.equal(gs.isImageMime_('application/pdf'), false);
  assert.equal(gs.thumbUrl_('X1'), 'https://drive.google.com/thumbnail?id=X1&sz=w400');
});

test('verifyToken_ accepts UTF-8 client names (accented)', () => {
  const gs = loadBackend();
  const v = gs.verifyToken_(makeToken(`José García|${NOW + 3600}`, SECRET), SECRET, NOW);
  assert.equal(v.ok, true);
  assert.equal(v.name, 'José García');
});
