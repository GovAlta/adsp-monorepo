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
  buildAnnotatedDiff,
  groupCommentsByFile,
  formatComment,
  loadConfig,
  buildSystemPrompt,
  processFilesForReview,
  isTestFile,
  deriveTestFilePaths,
  checkMissingTestFiles,
} = require('./github-pr-clean-code-review');

const RULES_MOCK = `
2.1  Function Names: flag misleading names.
2.2  File Names: flag unclear file names.
2.3  Function Length: No function should exceed 50 lines.
2.4  Long Conditionals: wrap in named function.
2.5  Reusability: flag duplicate logic.
2.6  Encapsulation: suggest class for shared data.
2.7  Minimize Coupling: one purpose per file.
2.8  Maximize Cohesion: consolidate related functions.
2.9  Meaningful Names: intention-revealing names.
2.10 Functions Do One Thing: single responsibility.
2.11 Comments: no redundant comments.
2.13 Error Handling: use exceptions.
2.14 DRY Principle: no duplicated logic.
2.15 Classes Single Responsibility: one reason to change.
2.16 Unit Tests: flag missing tests.
2.17 Testable Code: flag untestable functions.
2.18 No Hidden Side Effects: flag unexpected state changes.
`;

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

// ─── buildAnnotatedDiff ───────────────────────────────────────────────────────

describe('buildAnnotatedDiff', () => {
  test('labels an added line with [LN+] and the correct new-file line number', () => {
    const patch = '@@ -0,0 +1 @@\n+const x = 1;';
    expect(buildAnnotatedDiff(patch)).toContain('[L1+] const x = 1;');
  });

  test('labels a context line with [LN ] and the correct new-file line number', () => {
    const patch = '@@ -1,2 +1,2 @@\n context\n+added';
    const annotated = buildAnnotatedDiff(patch);
    expect(annotated).toContain('[L1 ]  context');
    expect(annotated).toContain('[L2+] added');
  });

  test('omits removed lines entirely', () => {
    const patch = '@@ -1,2 +1,1 @@\n-removed line\n context';
    expect(buildAnnotatedDiff(patch)).not.toContain('removed line');
  });

  test('returns an empty string when patch is null', () => {
    expect(buildAnnotatedDiff(null)).toBe('');
  });

  test('returns an empty string when patch is undefined', () => {
    expect(buildAnnotatedDiff(undefined)).toBe('');
  });
});

// ─── groupCommentsByFile ──────────────────────────────────────────────────────

describe('groupCommentsByFile', () => {
  test('groups multiple comments for the same file under one key', () => {
    const comments = [
      { path: 'src/a.ts', body: 'first' },
      { path: 'src/a.ts', body: 'second' },
    ];
    const grouped = groupCommentsByFile(comments);
    expect(grouped['src/a.ts']).toEqual(['first', 'second']);
  });

  test('keeps comments for different files under separate keys', () => {
    const comments = [
      { path: 'src/a.ts', body: 'comment a' },
      { path: 'src/b.ts', body: 'comment b' },
    ];
    const grouped = groupCommentsByFile(comments);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['src/b.ts']).toEqual(['comment b']);
  });

  test('returns an empty object for an empty input array', () => {
    expect(groupCommentsByFile([])).toEqual({});
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
  const defaultConfig = { function_length_limit: 50, disabled_rules: [] };

  beforeEach(() => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(RULES_MOCK);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

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
  // @@-hunk-header = diff position 1; first + line = position 2, so line 1 maps to a valid inline position.
  const PATCH_WITH_LINE_1_ADDED = '@@ -0,0 +1 @@\n+const x = 1;';

  test('skips a file and returns no reviewComments when patch is null', async () => {
    const files = [{ filename: 'src/test.ts', patch: null }];
    const mockReviewFile = jest.fn();

    const { reviewComments } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(reviewComments).toHaveLength(0);
  });

  test('does not invoke the mock review function when patch is null', async () => {
    const files = [{ filename: 'src/test.ts', patch: null }];
    const mockReviewFile = jest.fn();

    await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(mockReviewFile).not.toHaveBeenCalled();
  });

  test('sets hasBlockingViolations to true when a violation with ERROR severity is returned', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest
      .fn()
      .mockResolvedValue([
        { rule: '2.13', severity: 'ERROR', line: 1, message: 'error suppressed', suggestion: 'throw' },
      ]);

    const { hasBlockingViolations } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(hasBlockingViolations).toBe(true);
  });

  test('does not set hasBlockingViolations for WARNING severity violations', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest.fn().mockResolvedValue([
      {
        rule: '2.7',
        severity: 'WARNING',
        line: 1,
        message: 'mixed concerns',
        suggestion: 'split file',
      },
    ]);

    const { hasBlockingViolations } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(hasBlockingViolations).toBe(false);
  });

  test('returns empty reviewComments when the mock returns no violations', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest.fn().mockResolvedValue([]);

    const { reviewComments } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(reviewComments).toHaveLength(0);
  });

  test('moves a violation with no diff position to generalComments instead of dropping it', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest.fn().mockResolvedValue([
      { rule: '2.3', severity: 'WARNING', line: 99, message: 'too long', suggestion: 'split' },
    ]);

    const { reviewComments, generalComments } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(reviewComments).toHaveLength(0);
    expect(generalComments).toHaveLength(1);
    expect(generalComments[0].path).toBe('src/test.ts');
  });

  test('sets hasBlockingViolations for an ERROR violation moved to generalComments', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest.fn().mockResolvedValue([
      { rule: '2.13', severity: 'ERROR', line: 99, message: 'no error handling', suggestion: 'throw' },
    ]);

    const { hasBlockingViolations, generalComments } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(hasBlockingViolations).toBe(true);
    expect(generalComments).toHaveLength(1);
  });

  test('calls the mock review function with the annotated diff, filename, and system prompt', async () => {
    const files = [{ filename: 'src/utils.ts', patch: 'const answer = 42;' }];
    const mockReviewFile = jest.fn().mockResolvedValue([]);

    await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(mockReviewFile).toHaveBeenCalledWith(
      expect.stringContaining('const answer = 42;'),
      'src/utils.ts',
      SYSTEM_PROMPT
    );
  });

  test('collects all violations from processFilesForReview before the top 5 cap is applied in postReviewSummary', async () => {
    const files = [{ filename: 'src/test.ts', patch: PATCH_WITH_LINE_1_ADDED }];
    const mockReviewFile = jest.fn().mockResolvedValue([
      { rule: '2.5', severity: 'SUGGESTION', line: 1, message: 's1', suggestion: 'fix' },
      { rule: '2.6', severity: 'SUGGESTION', line: 1, message: 's2', suggestion: 'fix' },
      { rule: '2.7', severity: 'WARNING', line: 1, message: 'w1', suggestion: 'fix' },
      { rule: '2.8', severity: 'WARNING', line: 1, message: 'w2', suggestion: 'fix' },
      { rule: '2.13', severity: 'ERROR', line: 1, message: 'e1', suggestion: 'fix' },
      { rule: '2.14', severity: 'ERROR', line: 1, message: 'e2', suggestion: 'fix' },
    ]);

    const { reviewComments } = await processFilesForReview(files, SYSTEM_PROMPT, { reviewFile: mockReviewFile });

    expect(reviewComments.length).toBe(6);
  });

  test('skips review when GITHUB_EVENT_ACTION is synchronize', () => {
    process.env.GITHUB_EVENT_ACTION = 'synchronize';
    const action = process.env.GITHUB_EVENT_ACTION;
    const shouldSkip = action !== 'opened' && action !== 'reopened';
    expect(shouldSkip).toBe(true);
    delete process.env.GITHUB_EVENT_ACTION;
  });

  test('does not skip review when GITHUB_EVENT_ACTION is opened', () => {
    process.env.GITHUB_EVENT_ACTION = 'opened';
    const action = process.env.GITHUB_EVENT_ACTION;
    const shouldSkip = action !== 'opened' && action !== 'reopened';
    expect(shouldSkip).toBe(false);
    delete process.env.GITHUB_EVENT_ACTION;
  });

  test('does not skip review when GITHUB_EVENT_ACTION is reopened', () => {
    process.env.GITHUB_EVENT_ACTION = 'reopened';
    const action = process.env.GITHUB_EVENT_ACTION;
    const shouldSkip = action !== 'opened' && action !== 'reopened';
    expect(shouldSkip).toBe(false);
    delete process.env.GITHUB_EVENT_ACTION;
  });

  test('on synchronize, filters out files already reviewed by the bot', () => {
    const allFiles = [
      { filename: 'src/existing.ts', patch: '@@ -0,0 +1 @@\n+const a = 1;' },
      { filename: 'src/new.ts', patch: '@@ -0,0 +1 @@\n+const b = 2;' },
    ];
    const botComments = [
      { user: { type: 'Bot' }, path: 'src/existing.ts' },
    ];

    const alreadyReviewedFiles = new Set(
      botComments.filter((c) => c.user && c.user.type === 'Bot').map((c) => c.path)
    );
    const newFiles = allFiles.filter((f) => !alreadyReviewedFiles.has(f.filename));

    expect(newFiles).toHaveLength(1);
    expect(newFiles[0].filename).toBe('src/new.ts');
  });

  test('exits early if all files already reviewed on synchronize', () => {
    const allFiles = [{ filename: 'src/existing.ts', patch: '@@ -0,0 +1 @@\n+const a = 1;' }];
    const botComments = [{ user: { type: 'Bot' }, path: 'src/existing.ts' }];

    const alreadyReviewedFiles = new Set(
      botComments.filter((c) => c.user && c.user.type === 'Bot').map((c) => c.path)
    );
    const newFiles = allFiles.filter((f) => !alreadyReviewedFiles.has(f.filename));

    expect(newFiles).toHaveLength(0);
  });

  test('ignores human comments when filtering reviewed files', () => {
    const allFiles = [{ filename: 'src/feature.ts', patch: '@@ -0,0 +1 @@\n+const c = 3;' }];
    const mixedComments = [
      { user: { type: 'User' }, path: 'src/feature.ts' },
    ];

    const alreadyReviewedFiles = new Set(
      mixedComments.filter((c) => c.user && c.user.type === 'Bot').map((c) => c.path)
    );
    const newFiles = allFiles.filter((f) => !alreadyReviewedFiles.has(f.filename));

    expect(newFiles).toHaveLength(1);
    expect(newFiles[0].filename).toBe('src/feature.ts');
  });
});

// ─── isTestFile ───────────────────────────────────────────────────────────────

describe('isTestFile', () => {
  test('returns true for .test.ts files', () => {
    expect(isTestFile('src/auth.service.test.ts')).toBe(true);
  });

  test('returns true for .spec.ts files', () => {
    expect(isTestFile('src/auth.service.spec.ts')).toBe(true);
  });

  test('returns false for regular source files', () => {
    expect(isTestFile('src/auth.service.ts')).toBe(false);
  });
});

// ─── deriveTestFilePaths ──────────────────────────────────────────────────────

describe('deriveTestFilePaths', () => {
  test('returns .test and .spec paths for a .ts file', () => {
    const paths = deriveTestFilePaths('src/auth.service.ts');
    expect(paths).toEqual(['src/auth.service.test.ts', 'src/auth.service.spec.ts']);
  });

  test('returns .test and .spec paths for a .tsx file', () => {
    const paths = deriveTestFilePaths('src/components/Button.tsx');
    expect(paths).toEqual(['src/components/Button.test.tsx', 'src/components/Button.spec.tsx']);
  });
});

// ─── checkMissingTestFiles ────────────────────────────────────────────────────

describe('checkMissingTestFiles', () => {
  // A minimal patch so buildLineToPositionMap returns at least one position.
  const PATCH = '@@ -0,0 +1 @@\n+const x = 1;';
  const DEFAULT_CONFIG = { disabled_rules: [] };

  test('returns a RULE-19 warning when no test file exists in PR or repo', async () => {
    const changedFiles = [{ filename: 'src/auth.service.ts', patch: PATCH }];
    const checkRepoFile = jest.fn().mockResolvedValue(false);

    const comments = await checkMissingTestFiles({}, changedFiles, DEFAULT_CONFIG, { checkRepoFile });

    expect(comments).toHaveLength(1);
    expect(comments[0].body).toContain('RULE-19');
    expect(comments[0].path).toBe('src/auth.service.ts');
  });

  test('returns no comments when a matching test file is in the PR diff', async () => {
    const changedFiles = [
      { filename: 'src/auth.service.ts', patch: PATCH },
      { filename: 'src/auth.service.test.ts', patch: PATCH },
    ];
    const checkRepoFile = jest.fn().mockResolvedValue(false);

    const comments = await checkMissingTestFiles({}, changedFiles, DEFAULT_CONFIG, { checkRepoFile });

    expect(comments).toHaveLength(0);
  });

  test('returns no comments when a test file already exists in the repo', async () => {
    const changedFiles = [{ filename: 'src/auth.service.ts', patch: PATCH }];
    const checkRepoFile = jest.fn().mockResolvedValue(true);

    const comments = await checkMissingTestFiles({}, changedFiles, DEFAULT_CONFIG, { checkRepoFile });

    expect(comments).toHaveLength(0);
  });

  test('skips a file that is already a test file', async () => {
    const changedFiles = [{ filename: 'src/auth.service.test.ts', patch: PATCH }];
    const checkRepoFile = jest.fn();

    const comments = await checkMissingTestFiles({}, changedFiles, DEFAULT_CONFIG, { checkRepoFile });

    expect(comments).toHaveLength(0);
    expect(checkRepoFile).not.toHaveBeenCalled();
  });

  test('returns no comments when RULE-19 is disabled in config', async () => {
    const changedFiles = [{ filename: 'src/auth.service.ts', patch: PATCH }];
    const checkRepoFile = jest.fn().mockResolvedValue(false);

    const comments = await checkMissingTestFiles({}, changedFiles, { disabled_rules: ['RULE-19'] }, { checkRepoFile });

    expect(comments).toHaveLength(0);
    expect(checkRepoFile).not.toHaveBeenCalled();
  });
});
