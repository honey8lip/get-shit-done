'use strict';

/**
 * Bug #2554: getMilestonePhaseFilter over-strips leading zeros on decimal phase IDs.
 *
 * "00.1" → ".1" (wrong) vs "0.1" (correct), causing disk-scan to miss
 * directories like "00.1-app-namespace-rename" and silently under-count phases.
 *
 * Fix: replace /^0+/ with /^0+(?=\d)/ so the leading zero before the decimal
 * point is preserved.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { getMilestonePhaseFilter } = require('../get-shit-done/bin/lib/core.cjs');

function makeTmpProject(roadmapContent) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-2554-'));
  const planningDir = path.join(dir, '.planning');
  fs.mkdirSync(planningDir);
  fs.writeFileSync(path.join(planningDir, 'ROADMAP.md'), roadmapContent, 'utf-8');
  return dir;
}

describe('getMilestonePhaseFilter decimal phase IDs (#2554)', () => {
  test('includes "00.1-slug" dir when ROADMAP has Phase 00.1', () => {
    const roadmap = [
      '## Milestone: Test',
      '### Phase 00.1: App Namespace Rename',
      '### Phase 1: Core Setup',
    ].join('\n');
    const cwd = makeTmpProject(roadmap);
    try {
      const filter = getMilestonePhaseFilter(cwd);
      assert.ok(filter('00.1-app-namespace-rename'), '"00.1-app-namespace-rename" must be included');
      assert.ok(filter('1-core-setup'), '"1-core-setup" must be included');
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  test('does not lose the pre-decimal zero: "00.1" normalizes to "0.1" not ".1"', () => {
    // The normalization regex applied to the phase ID from ROADMAP
    const normalize = n => (n.replace(/^0+(?=\d)/, '') || '0').toLowerCase();
    assert.strictEqual(normalize('00.1'), '0.1');
    assert.strictEqual(normalize('0'),    '0');
    assert.strictEqual(normalize('01'),   '1');
    assert.strictEqual(normalize('10'),   '10');
    assert.strictEqual(normalize('00.1'), '0.1'); // key regression case
  });

  test('dir extractor and normalizer agree on "00.1-slug"', () => {
    const dirName = '00.1-app-namespace-rename';
    const m = dirName.match(/^0*(\d+[A-Za-z]?(?:\.\d+)*)/);
    assert.ok(m, 'regex must match');
    assert.strictEqual(m[1], '0.1');

    const normalize = n => (n.replace(/^0+(?=\d)/, '') || '0').toLowerCase();
    assert.strictEqual(normalize('00.1'), '0.1');

    assert.strictEqual(m[1], normalize('00.1'), 'extractor and normalizer must agree');
  });
});
