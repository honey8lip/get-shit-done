/**
 * Regression test for bug #2516
 *
 * When `.planning/config.json` has `model_profile: "inherit"`, the
 * `init.execute-phase` query returns `executor_model: "inherit"`. The
 * execute-phase workflow was passing this literal string directly to the
 * Task tool via `model="{executor_model}"`, causing Task to fall back to
 * its default model instead of inheriting the orchestrator model.
 *
 * Fix: the workflow must document that when `executor_model` is `"inherit"`,
 * the `model=` parameter must be OMITTED from Task() calls entirely.
 * Omitting `model=` causes Claude Code to inherit the current orchestrator
 * model automatically.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  'get-shit-done',
  'workflows',
  'execute-phase.md'
);

describe('bug #2516: executor_model "inherit" must not be passed literally to Task()', () => {
  const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');

  test('workflow file exists', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'get-shit-done/workflows/execute-phase.md should exist');
  });

  test('workflow contains instructions for handling the "inherit" case', () => {
    const hasInheritInstruction =
      content.includes('"inherit"') &&
      (content.includes('omit') || content.includes('Omit') || content.includes('omitting') || content.includes('Omitting'));
    assert.ok(
      hasInheritInstruction,
      'execute-phase.md must document that when executor_model is "inherit", ' +
      'the model= parameter must be omitted from Task() calls. ' +
      'Found "inherit" mention: ' + content.includes('"inherit"') + '. ' +
      'Found omit mention: ' + (content.includes('omit') || content.includes('Omit'))
    );
  });

  test('workflow does not instruct passing model="inherit" literally to Task', () => {
    // The workflow must not have an unconditional model="{executor_model}" template
    // that would pass "inherit" through. It should document conditional logic.
    const hasConditionalModelParam =
      content.includes('inherit') &&
      (
        content.includes('Only set `model=`') ||
        content.includes('only set `model=`') ||
        content.includes('Only set model=') ||
        content.includes('omit the `model=`') ||
        content.includes('omit the model=') ||
        content.includes('omit `model=`') ||
        content.includes('omit model=')
      );
    assert.ok(
      hasConditionalModelParam,
      'execute-phase.md must document omitting model= when executor_model is "inherit". ' +
      'The unconditional model="{executor_model}" template would pass the literal ' +
      'string "inherit" to Task(), which falls back to the default model instead ' +
      'of the orchestrator model (root cause of #2516).'
    );
  });

  test('workflow documents that omitting model= causes inheritance from orchestrator', () => {
    const hasInheritanceExplanation =
      content.includes('inherit') &&
      (
        content.includes('orchestrator model') ||
        content.includes('orchestrator\'s model') ||
        content.includes('inherits the') ||
        content.includes('inherit the current')
      );
    assert.ok(
      hasInheritanceExplanation,
      'execute-phase.md must explain that omitting model= causes Claude Code to ' +
      'inherit the current orchestrator model — this is the mechanism that makes ' +
      '"inherit" work correctly.'
    );
  });
});
