'use strict';

/**
 * Bug #2559: Research phase appends hardcoded year to web search queries.
 *
 * Both gsd-phase-researcher and gsd-project-researcher instructed agents to
 * "Always include current year" in web searches. LLMs interpret this as adding
 * their training cutoff year (e.g., "2024"), returning stale results.
 *
 * Fix: Remove year-append instruction; use "latest"/"current" or --freshness.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PHASE_RESEARCHER = path.join(__dirname, '..', 'agents', 'gsd-phase-researcher.md');
const PROJECT_RESEARCHER = path.join(__dirname, '..', 'agents', 'gsd-project-researcher.md');

describe('research phase web search — no stale year injection (#2559)', () => {
  test('gsd-phase-researcher.md must not instruct "Always include current year"', () => {
    const src = fs.readFileSync(PHASE_RESEARCHER, 'utf-8');
    assert.ok(
      !src.includes('Always include current year'),
      'gsd-phase-researcher must not instruct agents to append "current year" to searches',
    );
  });

  test('gsd-project-researcher.md must not instruct "Always include current year"', () => {
    const src = fs.readFileSync(PROJECT_RESEARCHER, 'utf-8');
    assert.ok(
      !src.includes('Always include current year'),
      'gsd-project-researcher must not instruct agents to append "current year" to searches',
    );
  });

  test('gsd-phase-researcher.md must instruct against hardcoded year in queries', () => {
    const src = fs.readFileSync(PHASE_RESEARCHER, 'utf-8');
    assert.ok(
      src.includes('hardcoded year') || src.includes('specific year') || src.includes('Do NOT append'),
      'gsd-phase-researcher must warn against hardcoded year in search queries',
    );
  });

  test('gsd-project-researcher.md must instruct against hardcoded year in queries', () => {
    const src = fs.readFileSync(PROJECT_RESEARCHER, 'utf-8');
    assert.ok(
      src.includes('hardcoded year') || src.includes('specific year') || src.includes('Do NOT append'),
      'gsd-project-researcher must warn against hardcoded year in search queries',
    );
  });

  test('gsd-project-researcher.md query templates must use "latest"/"current" not "[current year]"', () => {
    const src = fs.readFileSync(PROJECT_RESEARCHER, 'utf-8');
    assert.ok(
      !src.includes('[current year]'),
      'gsd-project-researcher query templates must not contain "[current year]" placeholder',
    );
  });
});
