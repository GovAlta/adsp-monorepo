'use strict';

/**
 * Unit tests for github-pr-clean-code-review.js
 *
 * All external dependencies (fs, @octokit/rest) are mocked so no filesystem
 * or network access occurs during the test run.
 */

// Set required env vars before requiring the module to prevent reference errors
// when the module-level constants are initialised.
process.env.GITHUB_TOKEN = 'test-token';
process.env.PR_NUMBER = '1';
process.env.REPO_OWNER = 'test-owner';
process.env.REPO_NAME = 'test-repo';
process.env.HEAD_SHA = 'head-sha';

jest.mock('fs');
jest.mock('@octokit/rest', () => ({ Octokit: jest.fn() }));

const fs = require('fs');

const {
  buildLineToPositionMap,
  formatComment,
  loadConfig,
  buildSystemPrompt,
  processFilesForReview,
} = require('./github-pr-clean-code-review');

// ─── buildLineToPositionMap ───────────────────────────────────────────────────

describe('buildLineToPositionMap', () => {
  test('maps an added line to its correct diff position', () => {
    // Patch: @@ header (pos 1), context line (pos 2), added line (pos 3), context line (pos 4)
    // The added line is at new-file line 2, so map[2] === 3.
    const patch = '@@ -1,3 +1,4 @@\n context\n+added line\n context';
    const map = buildLineToPositionMap(patch);
    expect(map[2]).toBe(3);
  });

  test('returns an empty object when patch is null', () => {
    expect(buildLineToPositionMap(null)).toEqual({});
  });

  test('returns an empty object when patch is undefined', () => {
    expect(buildLineToPositionMap(undefined)).toEqual({});
  });

  test('does not map removed lines to any diff position', () => {
    const patch = '@@ -1,2 +1,1 @@\n-removed line\n context';
    expect(buildLineToPositionMap(patch)).toEqual({});
  });
});

// ─── formatComment ────────────────────────────────────────────────────────────

describe('formatComment', () => {
  test('includes the ERROR icon for ERROR severity', () => {
    const comment = formatComment({ rule: '2.9', severity: 'ERROR', message: 'bad name', suggestion: 'rename' });
    expect(comment).toContain('🔴');
  });

  test('includes the WARNING icon for WARNING severity', () => {
    const comment = formatComment({
      rule: '2.4',
      severity: 'WARNING',
      message: 'complex condition',
      suggestion: 'extract',
    });
    expect(comment).toContain('🟡');
  });

  test('includes the SUGGESTION icon for SUGGESTION severity', () => {
    const comment = formatComment({
      rule: '2.5',
      severity: 'SUGGESTION',
      message: 'duplicate logic',
      suggestion: 'extract',
    });
    expect(comment).toContain('🟢');
  });

  test('includes the rule number in the comment body', () => {
    const comment = formatComment({ rule: '2.9', severity: 'ERROR', message: 'bad name', suggestion: 'rename' });
    expect(comment).toContain('2.9');
  });

  test('includes the suppression instruction with the correct rule number', () => {
    const comment = formatComment({ rule: '2.10', severity: 'ERROR', message: 'does too much', suggestion: 'split' });
    expect(comment).toContain('clean-code-ignore: 2.10');
  });
});

// ─── loadConfig ───────────────────────────────────────────────────────────────

describe('loadConfig', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns the default function_length_limit of 50 when .cleancode.yml does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(loadConfig().function_length_limit).toBe(50);
  });

  test('returns the default languages array when .cleancode.yml does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(loadConfig().languages).toEqual(['ts', 'tsx', 'js', 'jsx']);
  });

  test('reads function_length_limit from .cleancode.yml when the file exists', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('function_length_limit: 30\n');
    expect(loadConfig().function_length_limit).toBe(30);
  });
});

// ─── buildSystemPrompt ────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  const defaultConfig = { function_length_limit: 50 };

  test('does not include a JIRA CONTEXT section when jiraContext is null', () => {
    expect(buildSystemPrompt(defaultConfig, null)).not.toContain('JIRA CONTEXT');
  });

  test('includes the Jira ticket ID in the prompt when jiraContext is provided', () => {
    expect(buildSystemPrompt(defaultConfig, 'CS-1234')).toContain('CS-1234');
  });

  test('includes the JIRA CONTEXT section header when jiraContext is provided', () => {
    expect(buildSystemPrompt(defaultConfig, 'CS-1234')).toContain('JIRA CONTEXT');
  });

  // Each rule is verified individually for clear failure messages.
  // Rule 2.12 was intentionally removed from the rule set; 2.19 was folded into Jira context
  // handling at the function level rather than kept as a prompt rule.
  const EXPECTED_RULES = [
    '2.1',
    '2.2',
    '2.3',
    '2.4',
    '2.5',
    '2.6',
    '2.7',
    '2.8',
    '2.9',
    '2.10',
    '2.11',
    '2.13',
    '2.14',
    '2.15',
    '2.16',
    '2.17',
    '2.18',
  ];

  test.each(EXPECTED_RULES)('includes rule %s in the returned prompt', (rule) => {
    const prompt = buildSystemPrompt(defaultConfig, null);
    // Append a space to avoid false matches (e.g. '2.1' incorrectly matching '2.10')
    expect(prompt).toContain(`${rule} `);
  });
});

// ─── processFilesForReview ────────────────────────────────────────────────────

describe('processFilesForReview', () => {
  const SYSTEM_PROMPT = 'test system prompt';
  // Patch where new-file line 1 maps to diff position 2 — ensures a violation
  // on line 1 is included in reviewComments rather than silently dropped.
  const PATCH_WITH_LINE_1_ADDED = '@@ -0,0 +1 @@\n+const x = 1;';

  test('skips a file and returns no reviewComments when patch is null', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: null }];
    const reviewFile = jest.fn();

    const { reviewComments } = await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(reviewComments).toHaveLength(0);
  });

  test('does not call reviewFile when patch is null', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: null }];
    const reviewFile = jest.fn();

    await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(reviewFile).not.toHaveBeenCalled();
  });

  test('sets hasBlockingViolations to true when a violation with ERROR severity is returned', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const reviewFile = jest
      .fn()
      .mockResolvedValue([
        { rule: '2.13', severity: 'ERROR', line: 1, message: 'error suppressed', suggestion: 'throw' },
      ]);

    const { hasBlockingViolations } = await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(hasBlockingViolations).toBe(true);
  });

  test('does not set hasBlockingViolations for WARNING severity violations', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const reviewFile = jest.fn().mockResolvedValue([
      {
        rule: '2.7',
        severity: 'WARNING',
        line: 1,
        message: 'mixed concerns',
        suggestion: 'split file',
      },
    ]);

    const { hasBlockingViolations } = await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(hasBlockingViolations).toBe(false);
  });

  test('returns empty reviewComments when reviewFile returns no violations', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const reviewFile = jest.fn().mockResolvedValue([]);

    const { reviewComments } = await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(reviewComments).toHaveLength(0);
  });

  test('calls reviewFile with the patch content, filename, and system prompt', async () => {
    const changedFiles = [{ filename: 'src/utils.ts', patch: 'const answer = 42;' }];
    const reviewFile = jest.fn().mockResolvedValue([]);

    await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(reviewFile).toHaveBeenCalledWith('const answer = 42;', 'src/utils.ts', SYSTEM_PROMPT);
  });

  test('posts only the top 5 violations when more than 5 are returned', async () => {
    const changedFiles = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const reviewFile = jest.fn().mockResolvedValue([
      { rule: '2.5', severity: 'SUGGESTION', line: 1, message: 's1', suggestion: 'fix' },
      { rule: '2.6', severity: 'SUGGESTION', line: 1, message: 's2', suggestion: 'fix' },
      { rule: '2.7', severity: 'WARNING', line: 1, message: 'w1', suggestion: 'fix' },
      { rule: '2.8', severity: 'WARNING', line: 1, message: 'w2', suggestion: 'fix' },
      { rule: '2.13', severity: 'ERROR', line: 1, message: 'e1', suggestion: 'fix' },
      { rule: '2.14', severity: 'ERROR', line: 1, message: 'e2', suggestion: 'fix' },
    ]);

    const { reviewComments } = await processFilesForReview(changedFiles, SYSTEM_PROMPT, { reviewFile });

    expect(reviewComments.length).toBeLessThanOrEqual(5);
  });
});
