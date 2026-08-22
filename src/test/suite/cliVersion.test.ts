import * as assert from 'assert';
import { compareCliVersions, isCliOutdated } from '../../utils/globalUtils';

// The floor the webview is built against is injected by webpack, so a test in
// the extension host has to supply it the way DefinePlugin would.
function withFloor(floor: string, body: () => void): void {
  const original = process.env.CLI_VERSION;
  process.env.CLI_VERSION = floor;
  try {
    body();
  } finally {
    if (original === undefined) {
      delete process.env.CLI_VERSION;
    } else {
      process.env.CLI_VERSION = original;
    }
  }
}

suite('compareCliVersions', () => {
  test('orders by segment rather than as text', () => {
    // 0.9.15 sorts after 0.15.0 as text; the comparison must not agree.
    assert.ok(compareCliVersions('0.9.15', '0.15.0') < 0);
    assert.ok(compareCliVersions('0.15.0', '0.9.15') > 0);
  });

  test('reports equal versions as equal', () => {
    assert.strictEqual(compareCliVersions('0.15.0', '0.15.0'), 0);
  });

  test('treats a missing segment as zero', () => {
    assert.strictEqual(compareCliVersions('0.15', '0.15.0'), 0);
    assert.ok(compareCliVersions('0.15', '0.15.1') < 0);
  });

  test('stops at the first segment that differs', () => {
    // The earlier segment settles it, however much smaller the later one is.
    assert.ok(compareCliVersions('1.2.3', '0.15.0') > 0);
    assert.ok(compareCliVersions('0.16.1', '0.9.5') > 0);
  });

  test('reads a segment up to its pre-release suffix', () => {
    // A suffixed segment must keep its number rather than be dropped whole,
    // which would slide later segments into the wrong position.
    assert.strictEqual(compareCliVersions('0.15.0-beta', '0.15.0'), 0);
    assert.ok(compareCliVersions('0.15.3-beta', '0.15.0') > 0);
    assert.ok(compareCliVersions('1.2-beta.5', '1.3.0') < 0);
  });

  test('ends the version at the segment carrying the suffix', () => {
    // The tail of a suffix is not a further version segment, so a release
    // candidate must not read as newer than the release it precedes.
    assert.strictEqual(compareCliVersions('0.15.1-rc.2', '0.15.1'), 0);
    assert.ok(compareCliVersions('0.15.1-rc.2', '0.15.2') < 0);
  });

  test('stops at a segment with no leading number', () => {
    assert.strictEqual(compareCliVersions('unknown', '0.0.0'), 0);
    assert.ok(compareCliVersions('unknown', '0.15.0') < 0);
  });
});

suite('isCliOutdated', () => {
  test('prompts a CLI below the floor', () => {
    withFloor('0.15.0', () => {
      assert.strictEqual(isCliOutdated('0.14.9'), true);
      assert.strictEqual(isCliOutdated('0.9.15'), true);
    });
  });

  test('leaves a CLI at or above the floor alone', () => {
    withFloor('0.15.0', () => {
      assert.strictEqual(isCliOutdated('0.15.0'), false);
      assert.strictEqual(isCliOutdated('0.16.1'), false);
    });
  });

  test('does not prompt a newer major whose minor is below the floor', () => {
    // No 1.x CLI has shipped yet, so this is the case that wakes up on the
    // first one: 1.2.3 is newer than 0.15.0 and was reported as outdated.
    withFloor('0.15.0', () => {
      assert.strictEqual(isCliOutdated('1.0.0'), false);
      assert.strictEqual(isCliOutdated('1.2.3'), false);
      assert.strictEqual(isCliOutdated('2.0.1'), false);
    });
  });

  test('does not prompt a newer release when the floor carries a patch', () => {
    // Every release from 0.10.0 whose patch was below 5 was prompted while the
    // floor sat at 0.9.5, and any future floor with a non-zero patch does the
    // same to the next minor release.
    withFloor('0.9.5', () => {
      assert.strictEqual(isCliOutdated('0.10.0'), false);
      assert.strictEqual(isCliOutdated('0.16.1'), false);
    });
    withFloor('0.16.1', () => {
      assert.strictEqual(isCliOutdated('0.17.0'), false);
    });
  });

  test('does not prompt an unknown version', () => {
    withFloor('0.15.0', () => {
      assert.strictEqual(isCliOutdated(''), false);
      assert.strictEqual(isCliOutdated('   '), false);
      // Defensive: CliVersion.ts only posts a version matching
      // /Version\s+(\d+\.\d+\.\d+)/, so nothing non-numeric reaches here
      // today. Read as 0.0.0 it would sit below every floor and prompt an
      // update the user cannot act on.
      assert.strictEqual(isCliOutdated('unknown'), false);
      assert.strictEqual(isCliOutdated('v0.15.0'), false);
    });
  });
});
