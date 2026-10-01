import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('bundled action starts without project dependencies', () => {
  const bundleDir = fileURLToPath(new URL('../dist/', import.meta.url));
  const isolatedDir = mkdtempSync(path.join(tmpdir(), 'setup-nu-bundle-'));
  try {
    copyFileSync(path.join(bundleDir, 'index.js'), path.join(isolatedDir, 'index.js'));
    copyFileSync(path.join(bundleDir, 'package.json'), path.join(isolatedDir, 'package.json'));

    // An invalid input stops before any network call, after all eager imports have loaded.
    const result = spawnSync(process.execPath, [path.join(isolatedDir, 'index.js')], {
      encoding: 'utf8',
      env: { ...process.env, INPUT_FEATURES: 'invalid' },
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /Invalid features input: invalid/);
  } finally {
    rmSync(isolatedDir, { recursive: true, force: true });
  }
});
