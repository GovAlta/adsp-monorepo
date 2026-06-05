/**
 * github-pr-clean-code-review.js
 * Clean Code AI Review Agent — ADSP Monorepo
 *
 * Uses GitHub Models API (free, no external API key needed)
 * Posts inline review comments directly on the PR diff
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = parseInt(process.env.PR_NUMBER, 10);
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const HEAD_SHA = process.env.HEAD_SHA;

const SUPPORTED_FILE_EXTENSIONS_FOR_REVIEW = ['.ts', '.tsx', '.js', '.jsx'];

// ─────────────────────────────────────────────────────────────
// Load rules config (.cleancode.yml) if present
// ─────────────────────────────────────────────────────────────
function loadConfig() {
  const configPath = path.join(process.cwd(), '.cleancode.yml');
  const defaults = {
    function_length_limit: 50,
    languages: ['ts', 'tsx', 'js', 'jsx'],
    suppressions: [],
    disabled_rules: [],
  };
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const lines = raw.split('\n');
      let inDisabledRules = false;
      lines.forEach((line) => {
        if (/^\s*disabled_rules\s*:/.test(line)) {
          inDisabledRules = true;
          return;
        }
        if (inDisabledRules) {
          const listMatch = line.match(/^\s+-\s+"?([^"\s]+)"?\s*$/);
          if (listMatch) {
            defaults.disabled_rules.push(listMatch[1]);
            return;
          }
          if (line.trim() && !line.trim().startsWith('#') && !/^\s/.test(line)) {
            inDisabledRules = false;
          }
        }
        const match = line.match(/^\s*(\w+):\s*(.+)/);
        if (match) {
          inDisabledRules = false;
          const key = match[1].trim();
          const val = match[2].trim();
          if (key === 'function_length_limit') defaults.function_length_limit = parseInt(val, 10);
        }
      });
    } catch (e) {
      console.log('Could not parse .cleancode.yml, using defaults');
    }
  }
  return defaults;
}

// ─────────────────────────────────────────────────────────────
// Fetch and filter the PR's changed files to those with supported extensions
// ─────────────────────────────────────────────────────────────
async function fetchChangedFiles(octokit) {
  const files = [];
  let page = 1;
  while (true) {
    const res = await octokit.rest.pulls.listFiles({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: PR_NUMBER,
      per_page: 100,
      page,
    });
    files.push(...res.data);
    if (res.data.length < 100) break;
    page++;
  }
  return files.filter(
    (f) => f.status !== 'removed' && SUPPORTED_FILE_EXTENSIONS_FOR_REVIEW.includes(path.extname(f.filename)),
  );
}

// ─────────────────────────────────────────────────────────────
// Fetch Jira ticket description linked to this PR
// ─────────────────────────────────────────────────────────────
async function getJiraTicket(prTitle, prBody) {
  // Extract Jira ticket ID from PR title or body (e.g. CS-4894)
  const jiraPattern = /[A-Z]+-\d+/g;
  const titleMatches = (prTitle || '').match(jiraPattern) || [];
  const bodyMatches = (prBody || '').match(jiraPattern) || [];
  const ticketIds = [...new Set([...titleMatches, ...bodyMatches])];

  if (ticketIds.length === 0) {
    console.log('  No Jira ticket found in PR title or body');
    return null;
  }

  console.log(`  Found Jira ticket(s): ${ticketIds.join(', ')}`);
  // Return the ticket IDs found — full Jira API integration to be added in next phase
  return ticketIds.join(', ');
}

// ─────────────────────────────────────────────────────────────
// Build the system prompt with all Clean Code rules
// Reads canonical rules from architecture/clean-code-rules.md
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(config, jiraContext) {
  const jiraSection = jiraContext
    ? `\nJIRA CONTEXT:\nThe following Jira ticket(s) are associated with this PR: ${jiraContext}. Use this as additional context to verify whether the code correctly implements the requirements described in the ticket.\n`
    : '';

  // Load canonical rules from architecture/clean-code-rules.md
  let rulesContent = '';
  const rulesPath = path.join(process.cwd(), 'architecture', 'clean-code-rules.md');
  try {
    rulesContent = fs.readFileSync(rulesPath, 'utf8');
  } catch (e) {
    console.warn(`Could not read ${rulesPath}, falling back to inline rules`);
    rulesContent =
      'Apply standard clean code rules: naming, function length, SRP, DRY, error handling, no side effects.';
  }

  // Apply config overrides
  if (config.function_length_limit !== 50) {
    rulesContent = rulesContent.replace(
      /No function should exceed 50 lines/g,
      `No function should exceed ${config.function_length_limit} lines`,
    );
  }

  // Remove disabled rules from the prompt
  if (config.disabled_rules && config.disabled_rules.length > 0) {
    for (const rule of config.disabled_rules) {
      // Remove the rule section (### 2.X ...) — best effort
      const rulePattern = new RegExp(`### ${rule.replace('.', '\\.')}[^#]*(?=###|---|$)`, 's');
      rulesContent = rulesContent.replace(rulePattern, '');
    }
  }

  return `You are a Clean Code AI reviewer. Review the provided code and identify violations of the following rules.

${rulesContent}

SEVERITY LEVELS:
- ERROR: Rules 2.13, 2.14, 2.18
- WARNING: Rules 2.3, 2.4, 2.7, 2.8, 2.10
- SUGGESTION: Rules 2.1, 2.2, 2.5, 2.6, 2.9, 2.11, 2.15, 2.16, 2.17

SUPPRESSION: If a line contains the comment // clean-code-ignore: RULE_ID (e.g. // clean-code-ignore: 2.3), skip that rule for that line.

RESPONSE FORMAT:
Respond ONLY with a valid JSON array. No preamble, no explanation, no markdown. Each item:
{
  "rule": "2.X",
  "severity": "ERROR" | "WARNING" | "SUGGESTION",
  "line": <line number as integer>,
  "message": "<clear description of the violation>",
  "suggestion": "<specific actionable fix>"
}

If there are no violations, respond with an empty array: []
${jiraSection}`;
}

// ─────────────────────────────────────────────────────────────
// Call GitHub Models API (free, uses GITHUB_TOKEN)
// ─────────────────────────────────────────────────────────────
async function reviewWithGitHubModels(fileContent, fileName, systemPrompt) {
  const userMessage = `Review this file: ${fileName}\n\n\`\`\`\n${fileContent}\n\`\`\``;

  const response = await globalThis.fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub Models API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '[]';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn(`Could not parse response for ${fileName}:`, raw);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Map violations to PR diff positions
// ─────────────────────────────────────────────────────────────
function buildLineToPositionMap(patch) {
  if (!patch) return {};
  const map = {};
  let position = 0;
  let currentLine = 0;

  const lines = patch.split('\n');
  for (const line of lines) {
    position++;
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
      if (match) currentLine = parseInt(match[1], 10) - 1;
    } else if (line.startsWith('+')) {
      currentLine++;
      map[currentLine] = position;
    } else if (!line.startsWith('-')) {
      currentLine++;
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────
// Format comment body
// ─────────────────────────────────────────────────────────────
function formatComment(violation) {
  const icons = { ERROR: '🔴', WARNING: '🟡', SUGGESTION: '🟢' };
  const icon = icons[violation.severity] || '🔵';
  return `${icon} **Clean Code — Rule ${violation.rule}** \`${violation.severity}\`

${violation.message}

💡 **Suggestion:** ${violation.suggestion}

<sub>To suppress: add \`// clean-code-ignore: ${violation.rule}\` on this line</sub>`;
}

// ─────────────────────────────────────────────────────────────
// RULE-19: Check each changed source file has a colocated test file
// ─────────────────────────────────────────────────────────────
function isTestFile(filename) {
  return /\.(test|spec)\.[jt]sx?$/.test(filename);
}

function deriveTestFilePaths(filename) {
  const ext = path.extname(filename);
  const base = filename.slice(0, -ext.length);
  return [`${base}.test${ext}`, `${base}.spec${ext}`];
}

async function testFileExistsInRepo(octokit, filePath) {
  try {
    await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      ref: HEAD_SHA,
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function checkMissingTestFiles(octokit, changedFiles, config, { checkRepoFile = testFileExistsInRepo } = {}) {
  if (config.disabled_rules && config.disabled_rules.includes('RULE-19')) {
    return [];
  }

  const prFilenames = new Set(changedFiles.map((f) => f.filename));
  const missingTestComments = [];

  for (const file of changedFiles) {
    if (isTestFile(file.filename)) continue;
    if (!file.patch) continue;

    const expectedTestPaths = deriveTestFilePaths(file.filename);

    const existsInPr = expectedTestPaths.some((p) => prFilenames.has(p));
    if (existsInPr) continue;

    const repoChecks = await Promise.all(expectedTestPaths.map((p) => checkRepoFile(octokit, p)));
    if (repoChecks.some(Boolean)) continue;

    const lineToPosition = buildLineToPositionMap(file.patch);
    const positions = Object.values(lineToPosition);
    if (positions.length === 0) continue;

    missingTestComments.push({
      path: file.filename,
      position: Math.min(...positions),
      body: formatComment({
        rule: 'RULE-19',
        severity: 'WARNING',
        message: 'No unit test file found for this file. Please add or update tests.',
        suggestion: `Create a test file at ${expectedTestPaths[0]} colocated with this file.`,
      }),
    });
  }

  return missingTestComments;
}

// ─────────────────────────────────────────────────────────────
// Post review comments to the PR
// ─────────────────────────────────────────────────────────────
async function postReviewSummary(octokit, comments, hasBlockingViolations) {
  if (comments.length === 0) {
    await octokit.rest.pulls.createReview({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: PR_NUMBER,
      commit_id: HEAD_SHA,
      event: 'COMMENT',
      body: '✅ **Clean Code Review — No issues found!** The code looks good and meets all 18 Clean Code rules.',
    });
    return;
  }

  const errorCount = comments.filter((c) => c.body.includes('ERROR')).length;
  const warningCount = comments.filter((c) => c.body.includes('WARNING')).length;
  const suggestionCount = comments.filter((c) => c.body.includes('SUGGESTION')).length;

  const issueLines = [];
  if (errorCount > 0) issueLines.push(`🔴 ${errorCount} error(s) — recommended to fix before merging`);
  if (warningCount > 0) issueLines.push(`🟡 ${warningCount} warning(s) that should be reviewed`);
  if (suggestionCount > 0) issueLines.push(`🟢 ${suggestionCount} suggestion(s) for improvement`);

  const SEVERITY_ORDER = { ERROR: 0, WARNING: 1, SUGGESTION: 2 };
  const topComments = comments
    .sort((a, b) => {
      const getSeverity = (body) => {
        if (body.includes('ERROR')) return SEVERITY_ORDER.ERROR;
        if (body.includes('WARNING')) return SEVERITY_ORDER.WARNING;
        return SEVERITY_ORDER.SUGGESTION;
      };
      return getSeverity(a.body) - getSeverity(b.body);
    })
    .slice(0, 5);

  const event = 'COMMENT';

  const summary = hasBlockingViolations
    ? `🔴 **Clean Code Review — Issues found!**\n\nThere are issues in the code that are recommended to be addressed before merging:\n\n${issueLines.join('\n')}\n\nPlease review the inline comments on the changed lines for details on each issue.`
    : `🟡 **Clean Code Review — Issues found!**\n\nThere are some items in the code that need to be reviewed:\n\n${issueLines.join('\n')}\n\nPlease review the inline comments on the changed lines for details.`;

  await octokit.rest.pulls.createReview({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: PR_NUMBER,
    commit_id: HEAD_SHA,
    event,
    body: summary,
    comments: topComments,
  });
}

function initializeOctokit() {
  return new Octokit({ auth: GITHUB_TOKEN });
}

// ─────────────────────────────────────────────────────────────
// Process each changed file: call the AI model and collect review comments
// ─────────────────────────────────────────────────────────────
async function processFilesForReview(changedFiles, systemPrompt, { reviewFile = reviewWithGitHubModels } = {}) {
  const reviewComments = [];
  let hasBlockingViolations = false;

  for (const file of changedFiles) {
    console.log(`  Reviewing: ${file.filename}`);

    const content = file.patch;
    if (!content) {
      console.log(`  No diff available for ${file.filename}, skipping.`);
      continue;
    }

    let violations = [];
    try {
      violations = await reviewFile(content, file.filename, systemPrompt);
    } catch (e) {
      console.warn(`  Error reviewing ${file.filename}:`, e.message);
      continue;
    }

    if (!Array.isArray(violations) || violations.length === 0) {
      console.log(`  ✅ No violations in ${file.filename}`);
      continue;
    }

    console.log(`  ⚠️  ${violations.length} violation(s) in ${file.filename}`);

    const lineToPosition = buildLineToPositionMap(file.patch);

    for (const v of violations) {
      const position = lineToPosition[v.line];
      if (!position) continue;

      if (v.severity === 'ERROR') hasBlockingViolations = true;

      reviewComments.push({
        path: file.filename,
        position,
        body: formatComment(v),
      });
    }
  }

  return { reviewComments, hasBlockingViolations };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Clean Code Review Agent starting...');

  const octokit = initializeOctokit();
  const config = loadConfig();

  const changedFiles = await fetchChangedFiles(octokit);
  console.log(`📁 Files to review: ${changedFiles.length}`);

  if (changedFiles.length === 0) {
    console.log('No supported files changed. Skipping review.');
    return;
  }

  const PR_EVENT_ACTION = process.env.GITHUB_EVENT_ACTION;
  const isSynchronize = PR_EVENT_ACTION !== 'opened' && PR_EVENT_ACTION !== 'reopened';

  if (isSynchronize) {
    // On synchronize — only review files not yet reviewed
    // to avoid re-flagging files the developer is actively fixing
    const existingComments = await octokit.rest.pulls.listReviewComments({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      pull_number: PR_NUMBER,
    });

    const alreadyReviewedFiles = new Set(
      existingComments.data
        .filter((c) => c.user && c.user.type === 'Bot')
        .map((c) => c.path)
    );

    const newFiles = changedFiles.filter((f) => !alreadyReviewedFiles.has(f.filename));

    if (newFiles.length === 0) {
      console.log('Skipping review — all changed files already reviewed.');
      return;
    }

    console.log(`📂 New files since last review: ${newFiles.length}`);
    // Only review the new files on this synchronize push
    changedFiles.length = 0;
    changedFiles.push(...newFiles);
  }

  const prData = await octokit.rest.pulls.get({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: PR_NUMBER,
  });
  const jiraContext = await getJiraTicket(prData.data.title, prData.data.body);
  if (jiraContext) {
    console.log(`📋 Jira context: ${jiraContext}`);
  }

  const systemPrompt = buildSystemPrompt(config, jiraContext);
  const { reviewComments, hasBlockingViolations } = await processFilesForReview(changedFiles, systemPrompt);

  const missingTestComments = await checkMissingTestFiles(octokit, changedFiles, config);
  const allComments = [...reviewComments, ...missingTestComments];

  console.log(`\n📝 Posting review with ${allComments.length} comment(s)...`);
  await postReviewSummary(octokit, allComments, hasBlockingViolations);
  console.log('✅ Clean Code Review complete.');

  if (hasBlockingViolations) {
    console.log("🔴 Blocking violations found — merging is the human reviewer's decision.");
  }
}

// Guard against auto-execution when this module is require()'d by the test suite
if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Clean Code Review Agent failed:', err);
    process.exit(1);
  });
}

module.exports = {
  buildLineToPositionMap,
  formatComment,
  loadConfig,
  buildSystemPrompt,
  processFilesForReview,
  isTestFile,
  deriveTestFilePaths,
  checkMissingTestFiles,
};
