/**
 * Unit tests for the release resolution logic in `src/setup.ts`.
 *
 * Run with: pnpm test
 *
 * cspell:ignore deadbee
 *
 * Every case here mirrors a bug that reached the action at some point, the goal is regression
 * cover for the resolution rules rather than coverage for its own sake.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  filterLatest,
  filterLatestNightly,
  filterMatch,
  filterNightlyByCommit,
  findAsset,
  getTargets,
  isCommitSha,
  matchesSha,
  resolveVersionSpec,
} from '../src/setup.ts';

/** Builds the smallest release shape the filters actually read. */
// biome-ignore lint: the fixture only carries the fields under test
function release(tagName: string, assetNames: string[], publishedAt = '2026-01-01T00:00:00Z'): any {
  return {
    tag_name: tagName,
    published_at: publishedAt,
    assets: assetNames.map((name) => ({ name, browser_download_url: `https://example.test/${name}` })),
  };
}

// biome-ignore lint: the fixture only carries the fields under test
function page(...releases: any[]): any {
  return { data: releases };
}

/** An asset name that matches the current platform, whatever the test runs on. */
const localAsset = `nu-0.0.0-${getTargets('default')[0]}.tar.gz`;
const otherAsset = 'nu-0.0.0-some-other-platform.tar.gz';

describe('resolveVersionSpec', () => {
  test('keeps range semantics for a bare two-part version', () => {
    // Coercing `0.90` to `0.90.0` made the action fail outright, Nushell never released 0.90.0
    assert.equal(resolveVersionSpec('0.90'), '0.90');
  });

  test('keeps explicit ranges untouched', () => {
    assert.equal(resolveVersionSpec('^0.113'), '^0.113');
    assert.equal(resolveVersionSpec('>=0.95 <0.100'), '>=0.95 <0.100');
    assert.equal(resolveVersionSpec('0.98.x'), '0.98.x');
  });

  test('passes an exact version through unchanged', () => {
    assert.equal(resolveVersionSpec('0.98.0'), '0.98.0');
  });

  test('passes the special specs through unchanged', () => {
    assert.equal(resolveVersionSpec('*'), '*');
    assert.equal(resolveVersionSpec('nightly'), 'nightly');
  });

  test('coerces inputs that are no valid range', () => {
    assert.equal(resolveVersionSpec('v0.98-x64'), '0.98.0');
  });

  test('returns null for input that is no version at all', () => {
    assert.equal(resolveVersionSpec('not-a-version'), null);
  });
});

describe('isCommitSha', () => {
  test('accepts abbreviated and full SHAs', () => {
    assert.equal(isCommitSha('0df4ca2'), true);
    assert.equal(isCommitSha('a80dfe8'), true);
    assert.equal(isCommitSha('a'.repeat(40)), true);
  });

  test('rejects version specs and too short hex strings', () => {
    assert.equal(isCommitSha('0.112.1'), false);
    assert.equal(isCommitSha('nightly'), false);
    assert.equal(isCommitSha('*'), false);
    assert.equal(isCommitSha('0df4ca'), false);
    assert.equal(isCommitSha('a'.repeat(41)), false);
  });
});

describe('matchesSha', () => {
  test('compares on the shorter side so any abbreviation length matches', () => {
    assert.equal(matchesSha('0df4ca2abcdef', '0df4ca2'), true);
    assert.equal(matchesSha('0df4ca2', '0df4ca2abcdef'), true);
  });

  test('ignores case', () => {
    assert.equal(matchesSha('ABCDEF1', 'abcdef1'), true);
  });

  test('rejects a different commit', () => {
    assert.equal(matchesSha('0df4ca2', 'deadbee'), false);
  });
});

describe('getTargets', () => {
  test('returns targets for the current platform', () => {
    assert.ok(getTargets('default').length > 0);
  });

  test('throws for an unsupported feature/platform combination', () => {
    const originalArch = Object.getOwnPropertyDescriptor(process, 'arch');
    Object.defineProperty(process, 'arch', { value: 'mips', configurable: true });
    try {
      assert.throws(() => getTargets('default'), /Unsupported Nu target combination/);
    } finally {
      if (originalArch) {
        Object.defineProperty(process, 'arch', originalArch);
      }
    }
  });
});

describe('findAsset', () => {
  test('picks the asset matching one of the targets', () => {
    const assets = release('0.1.0', [otherAsset, localAsset]).assets;
    assert.equal(findAsset(assets, getTargets('default'))?.name, localAsset);
  });

  test('returns undefined when nothing matches', () => {
    const assets = release('0.1.0', [otherAsset]).assets;
    assert.equal(findAsset(assets, getTargets('default')), undefined);
  });
});

describe('filterMatch', () => {
  test('drops releases without an asset for this platform', () => {
    // Keeping them non-empty stopped the pagination before older releases were ever fetched
    const result = filterMatch(page(release('0.112.1', [otherAsset])), undefined, 'default');
    assert.deepEqual(result, []);
  });

  test('honours range semantics instead of exact matching', () => {
    const result = filterMatch(
      page(release('0.90.1', [localAsset]), release('0.89.0', [localAsset])),
      '0.90',
      'default'
    );
    assert.deepEqual(
      result.map((r) => r.version),
      ['0.90.1']
    );
  });

  test('strips a leading v from the tag', () => {
    const result = filterMatch(page(release('v0.96.0', [localAsset])), undefined, 'default');
    assert.equal(result[0].version, '0.96.0');
  });

  test('returns every match when no spec is given', () => {
    const result = filterMatch(
      page(release('0.2.0', [localAsset]), release('0.1.0', [localAsset])),
      undefined,
      'default'
    );
    assert.equal(result.length, 2);
  });
});

describe('filterLatest', () => {
  test('skips a newer release whose asset is missing', () => {
    // The newest release used to win the election and then resolve to nothing, which failed the
    // run instead of falling back to a release that is actually installable
    const result = filterLatest(page(release('0.112.1', [otherAsset]), release('0.113.1', [localAsset])), 'default');
    assert.deepEqual(
      result.map((r) => r.version),
      ['0.113.1']
    );
  });

  test('elects the highest version, not the first entry', () => {
    const result = filterLatest(
      page(release('0.99.0', [localAsset]), release('0.112.1', [localAsset]), release('0.100.0', [localAsset])),
      'default'
    );
    assert.equal(result[0].version, '0.112.1');
  });

  test('returns an empty page result so pagination continues', () => {
    assert.deepEqual(filterLatest(page(release('0.112.1', [otherAsset])), 'default'), []);
  });

  test('ignores tags that are no valid semver, semver.rsort would throw on them', () => {
    const result = filterLatest(page(release('not-semver', [localAsset]), release('0.1.0', [localAsset])), 'default');
    assert.equal(result[0].version, '0.1.0');
  });
});

describe('filterLatestNightly', () => {
  test('takes the newest nightly that has an asset', () => {
    // A nightly release exists before its assets finish uploading
    const result = filterLatestNightly(
      page(
        release('0.114.2-nightly.33', [otherAsset], '2026-08-13T03:00:00Z'),
        release('0.114.2-nightly.32', [localAsset], '2026-08-12T03:00:00Z')
      ),
      'default'
    );
    assert.deepEqual(
      result.map((r) => r.version),
      ['0.114.2-nightly.32']
    );
  });

  test('sorts by publication date rather than array order', () => {
    const result = filterLatestNightly(
      page(
        release('0.114.2-nightly.31', [localAsset], '2026-08-11T03:00:00Z'),
        release('0.114.2-nightly.33', [localAsset], '2026-08-13T03:00:00Z'),
        release('0.114.2-nightly.32', [localAsset], '2026-08-12T03:00:00Z')
      ),
      'default'
    );
    assert.equal(result[0].version, '0.114.2-nightly.33');
  });

  test('returns an empty page result so pagination continues', () => {
    assert.deepEqual(filterLatestNightly(page(release('0.1.0-nightly.1', [otherAsset])), 'default'), []);
  });
});

describe('filterNightlyByCommit', () => {
  test('matches the SHA embedded after a plus sign', () => {
    const result = filterNightlyByCommit(
      page(release('0.114.2-nightly.33+2b9ac16', [localAsset])),
      '2b9ac16',
      'default'
    );
    assert.equal(result[0].version, '0.114.2-nightly.33+2b9ac16');
    assert.equal(result[0].name, 'nightly');
  });

  test('matches the legacy nightly-<sha> tag form', () => {
    const result = filterNightlyByCommit(page(release('nightly-56ed69a', [localAsset])), '56ed69a', 'default');
    assert.equal(result[0].version, 'nightly-56ed69a');
  });

  test('ignores a release whose asset is missing for this platform', () => {
    assert.deepEqual(
      filterNightlyByCommit(page(release('0.114.2-nightly.33+2b9ac16', [otherAsset])), '2b9ac16', 'default'),
      []
    );
  });

  test('ignores a non-matching commit', () => {
    assert.deepEqual(
      filterNightlyByCommit(page(release('0.114.2-nightly.33+2b9ac16', [localAsset])), 'deadbee', 'default'),
      []
    );
  });
});
