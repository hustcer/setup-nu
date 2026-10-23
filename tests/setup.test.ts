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

import { test, describe, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import timers, { scheduler, setImmediate } from 'node:timers/promises';
import { Octokit } from '@octokit/rest';

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
  resolveRelease,
  MissingReleaseError,
  type Tool,
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
    assert.equal(isCommitSha('00c9ee0'), true);
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
    assert.equal(matchesSha('00c9ee0abcdef', '00c9ee0'), true);
    assert.equal(matchesSha('00c9ee0', '00c9ee0abcdef'), true);
  });

  test('ignores case', () => {
    assert.equal(matchesSha('ABCDEF1', 'abcdef1'), true);
  });

  test('rejects a different commit', () => {
    assert.equal(matchesSha('00c9ee0', 'deadbee'), false);
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

describe('release API recovery', () => {
  const tool: Tool = {
    owner: 'nushell',
    name: 'nushell',
    githubToken: '',
    checkLatest: false,
    enablePlugins: 'false',
    versionSpec: '*',
    features: 'default',
  };

  /** Exercise Octokit's request and error handling with local responses. */
  function client(
    reply: (url: string) => { status?: number; body: unknown; headers?: Record<string, string> }
  ): Octokit {
    return new Octokit({
      request: {
        fetch: async (url: string | URL | Request) => {
          const result = reply(String(url));
          return new Response(JSON.stringify(result.body), {
            status: result.status ?? 200,
            headers: { 'content-type': 'application/json', ...result.headers },
          });
        },
      },
    });
  }

  /** Node's mock timers do not intercept scheduler.wait, so route it through the mocked timer. */
  function mockRetryTimers(t: TestContext, now = Date.now()): void {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now });
    t.mock.method(scheduler, 'wait', (delay, options) => timers.setTimeout(delay, undefined, options));
  }

  test('retries an empty wildcard lookup', async () => {
    let requests = 0;
    const octokit = client(() => ({ body: ++requests === 1 ? [] : [release('0.116.1', [localAsset])] }));
    assert.equal((await resolveRelease(tool, octokit)).version, '0.116.1');
    assert.equal(requests, 2);
  });

  test('retries a transient API failure', async () => {
    let requests = 0;
    const octokit = client(() =>
      ++requests === 1
        ? { status: 503, body: { message: 'temporarily unavailable' } }
        : { body: [release('0.116.1', [localAsset])] }
    );
    assert.equal((await resolveRelease(tool, octokit)).version, '0.116.1');
    assert.equal(requests, 2);
  });

  test('bounds retries when no matching release is available', async () => {
    let requests = 0;
    const octokit = client(() => {
      requests++;
      return { body: [] };
    });
    await assert.rejects(resolveRelease(tool, octokit), MissingReleaseError);
    assert.equal(requests, 3);
  });

  test('does not retry authentication or permission failures', async () => {
    for (const status of [401, 403]) {
      let requests = 0;
      const octokit = client(() => {
        requests++;
        return { status, body: { message: 'Access denied' } };
      });
      await assert.rejects(resolveRelease(tool, octokit), { status });
      assert.equal(requests, 1);
    }
  });

  for (const status of [429, 503]) {
    for (const retryAfter of ['5', 'Fri, 23 Oct 2026 00:00:05 GMT']) {
      test(`honors Retry-After ${retryAfter} for HTTP ${status}`, async (t) => {
        mockRetryTimers(t, Date.parse('2026-10-23T00:00:00Z'));
        let requests = 0;
        const octokit = client(() =>
          ++requests === 1
            ? { status, body: { message: 'Try later' }, headers: { 'retry-after': retryAfter } }
            : { body: [release('0.116.1', [localAsset])] }
        );
        const result = resolveRelease(tool, octokit);
        await setImmediate();
        t.mock.timers.tick(4999);
        await setImmediate();
        assert.equal(requests, 1);
        t.mock.timers.tick(1);
        assert.equal((await result).version, '0.116.1');
        assert.equal(requests, 2);
      });
    }
  }

  test('honors the rate limit reset time when Retry-After is absent', async (t) => {
    const now = Date.parse('2026-10-23T00:00:00Z');
    mockRetryTimers(t, now);
    let requests = 0;
    const octokit = client(() =>
      ++requests === 1
        ? {
            status: 429,
            body: { message: 'Rate limit exceeded' },
            headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(now / 1000 + 90) },
          }
        : { body: [release('0.116.1', [localAsset])] }
    );
    const result = resolveRelease(tool, octokit);
    await setImmediate();
    t.mock.timers.tick(89_999);
    await setImmediate();
    assert.equal(requests, 1);
    t.mock.timers.tick(1);
    assert.equal((await result).version, '0.116.1');
    assert.equal(requests, 2);
  });

  for (const retryAfter of [undefined, 'invalid']) {
    test(`bounds rate limit retries with ${retryAfter === undefined ? 'no' : 'invalid'} Retry-After`, async (t) => {
      mockRetryTimers(t);
      let requests = 0;
      const octokit = client(() => {
        requests++;
        return {
          status: 429,
          body: { message: 'Rate limit exceeded' },
          headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter },
        };
      });
      const result = assert.rejects(resolveRelease(tool, octokit), { status: 429 });
      await setImmediate();
      for (const [attempt, wait] of [60_000, 120_000].entries()) {
        t.mock.timers.tick(wait - 1);
        await setImmediate();
        assert.equal(requests, attempt + 1);
        t.mock.timers.tick(1);
        await setImmediate();
        assert.equal(requests, attempt + 2);
      }
      await result;
    });
  }

  test('resolves exact versions by tag without listing releases', async () => {
    let requests = 0;
    const octokit = client((url) => {
      requests++;
      assert.ok(url.endsWith('/releases/tags/0.116.1'));
      return { body: release('0.116.1', [localAsset]) };
    });
    assert.equal((await resolveRelease({ ...tool, versionSpec: '0.116.1' }, octokit)).version, '0.116.1');
    assert.equal(requests, 1);
  });

  test('supports a v-prefixed release tag for an exact version', async () => {
    const urls: string[] = [];
    const octokit = client((url) => {
      urls.push(url);
      if (url.endsWith('/releases/tags/0.116.1')) return { status: 404, body: { message: 'Not Found' } };
      assert.ok(url.endsWith('/releases/tags/v0.116.1'));
      return { body: release('v0.116.1', [localAsset]) };
    });
    assert.equal((await resolveRelease({ ...tool, versionSpec: '0.116.1' }, octokit)).version, '0.116.1');
    assert.equal(urls.length, 2);
  });

  test('keeps range and check-latest lookups on the release list', async () => {
    for (const input of [{ versionSpec: '^0.116' }, { versionSpec: '0.115.0', checkLatest: true }]) {
      const octokit = client((url) => {
        assert.ok(url.endsWith('/releases?per_page=100'));
        return { body: [release('0.116.1', [localAsset])] };
      });
      assert.equal((await resolveRelease({ ...tool, ...input }, octokit)).version, '0.116.1');
    }
  });
});
