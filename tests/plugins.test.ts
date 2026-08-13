/**
 * Unit tests for the plugin input validation in `src/plugins.ts`.
 *
 * The validated values end up inside a shell command line, so these cases are the guard against
 * command injection through the `enable-plugins` input.
 *
 * `src/plugins.ts` is generated from `src/plugins-tpl.ts` by the build, run `pnpm run build`
 * first if the file is missing.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { validatePluginInput } from '../src/plugins.ts';

describe('validatePluginInput', () => {
  test('accepts the boolean forms', () => {
    assert.doesNotThrow(() => validatePluginInput('true'));
    assert.doesNotThrow(() => validatePluginInput('false'));
  });

  test('accepts a comma separated plugin list', () => {
    assert.doesNotThrow(() => validatePluginInput('nu_plugin_inc'));
    assert.doesNotThrow(() => validatePluginInput('nu_plugin_polars,nu_plugin_query,nu_plugin_inc'));
  });

  test('rejects shell metacharacters', () => {
    for (const injection of [
      'a;rm -rf /',
      'nu_plugin_inc && whoami',
      'nu_plugin_inc | cat',
      '$(id)',
      '`id`',
      'nu_plugin_inc\nwhoami',
      "nu_plugin_inc'",
      'nu_plugin_inc"',
    ]) {
      assert.throws(() => validatePluginInput(injection), /Invalid enable-plugins input/, `should reject ${injection}`);
    }
  });

  test('rejects spaces and a trailing comma', () => {
    assert.throws(() => validatePluginInput('nu_plugin_inc, nu_plugin_query'), /Invalid enable-plugins input/);
    assert.throws(() => validatePluginInput('nu_plugin_inc,'), /Invalid enable-plugins input/);
    assert.throws(() => validatePluginInput(''), /Invalid enable-plugins input/);
  });
});
