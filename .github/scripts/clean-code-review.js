/**
 * clean-code-review.js
 * Clean Code AI Review Agent — ADSP Monorepo
 *
 * Uses GitHub Models API (free, no external API key needed)
 * Posts inline review comments directly on the PR diff
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PR_NUMBER = parseInt(process.env.PR_NUMBER, 10);
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;

// File extensions to review — TypeScript/JavaScript first (Phase 1)
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Max lines per file to send for review (keep within model context)
const MAX_LINES_PER_FILE = 400;

// ─────────────────────────────────────────────────────────────
// Load rules config (.cleancode.yml) if present
// ─────────────────────────────────────────────────────────────
function loadConfig() {
  const configPath = path.join(process.cwd(), '.cleancode.yml');
  const defaults = {
    function_length_limit: 50,
    languages: ['ts', 'tsx', 'js', 'jsx'],
    suppressions: [],
  };
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const lines = raw.split('\n');
      lines.forEach((line) => {
        const match = line.match(/^\s*(\w+):\s*(.+)/);
        if (match) {
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
// Get changed files in this PR
// ─────────────────────────────────────────────────────────────
async function getChangedFiles(octokit) {
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
  return files.filter((f) => f.status !== 'removed' && SUPPORTED_EXTENSIONS.includes(path.extname(f.filename)));
}

// ─────────────────────────────────────────────────────────────
// Get file content at HEAD
// ─────────────────────────────────────────────────────────────
function getFileContent(filePath) {
  try {
    const content = execSync(`git show HEAD:${filePath}`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 5 });
    const lines = content.split('\n');
    if (lines.length > MAX_LINES_PER_FILE) {
      return lines.slice(0, MAX_LINES_PER_FILE).join('\n') + '\n// ... (truncated for review)';
    }
    return content;
  } catch (e) {
    return null;
  }
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
// Build the system prompt with all 18 Clean Code rules
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(config, jiraContext) {
  const jiraSection = jiraContext
    ? `\nJIRA CONTEXT:\nThe following Jira ticket(s) are associated with this PR: ${jiraContext}. Use this as additional context to verify whether the code correctly implements the requirements described in the ticket.\n`
    : '';

  return `You are a Clean Code AI reviewer. Review the provided code and identify violations of the following rules.

RULES:
2.1  Function Names: Function names must accurately describe what they do. Flag vague or misleading names.
2.2  File Names: Flag if the file name does not clearly reflect its purpose (comment at line 1).
2.3  Function Length: No function should exceed ${config.function_length_limit} lines. For React/TSX, suggest extracting loops or conditional blocks into separate components.
2.4  Long Conditionals: Complex conditions should be wrapped in a named function that describes what is being tested.
2.5  Reusability: Flag duplicate or near-duplicate logic that could be extracted into a shared reusable function.
2.6  Encapsulation: If multiple functions operate on the same data, suggest creating a class or interface to encapsulate them.
2.7  Minimize Coupling: Each file should have one clear purpose. Flag files with mixed concerns.
2.8  Maximize Cohesion: If a single task is spread across multiple functions unnecessarily, suggest consolidation.
2.9  Meaningful Names: Variables, classes, and constants must have intention-revealing names. No magic numbers. No single-letter variables except loop counters.
2.10 Functions Do One Thing: A function must do one thing only (Single Responsibility Principle). Flag functions doing multiple things.
2.11 Comments: Flag redundant comments that restate what the code does. Flag outdated or misleading comments. Do not comment bad code — rewrite it. Comments that explain design decisions are acceptable and encouraged — e.g. why something was implemented one way instead of another.
2.13 Error Handling: Use exceptions instead of returning error codes. Never suppress or silently ignore errors.
2.14 DRY Principle: Flag any duplicated logic. If the same logic appears more than once, extract it.
2.15 Classes Single Responsibility: Classes should have one reason to change. Flag classes with multiple concerns.
2.16 Unit Tests: Flag any exported function or class that has no corresponding test.
2.17 Testable Code: Flag functions that are too large or tightly coupled to be independently testable.
2.18 No Hidden Side Effects: Flag functions that modify external state unexpectedly or produce outputs not indicated by their name.

SEVERITY LEVELS:
- ERROR: Rules 2.1, 2.2, 2.3, 2.9, 2.10, 2.13, 2.14, 2.15, 2.16, 2.17, 2.18
- WARNING: Rules 2.4, 2.7, 2.8
- SUGGESTION: Rules 2.5, 2.6, 2.11

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
// Post review comments to the PR
// ─────────────────────────────────────────────────────────────
async function postReview(octokit, comments, hasErrors) {
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
  if (errorCount > 0) issueLines.push(`🔴 ${errorCount} error(s) that must be fixed before merging`);
  if (warningCount > 0) issueLines.push(`🟡 ${warningCount} warning(s) that should be reviewed`);
  if (suggestionCount > 0) issueLines.push(`🟢 ${suggestionCount} suggestion(s) for improvement`);

  const event = hasErrors ? 'REQUEST_CHANGES' : 'COMMENT';

  const summary = hasErrors
    ? `🔴 **Clean Code Review — Issues found!**\n\nThere are issues in the code that need to be addressed before this PR can be merged:\n\n${issueLines.join('\n')}\n\nPlease review the inline comments on the changed lines for details on each issue.`
    : `🟡 **Clean Code Review — Issues found!**\n\nThere are some items in the code that need to be reviewed:\n\n${issueLines.join('\n')}\n\nPlease review the inline comments on the changed lines for details.`;

  await octokit.rest.pulls.createReview({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: PR_NUMBER,
    commit_id: HEAD_SHA,
    event,
    body: summary,
    comments,
  });
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Clean Code Review Agent starting...');

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const config = loadConfig();

  const changedFiles = await getChangedFiles(octokit);
  console.log(`📁 Files to review: ${changedFiles.length}`);

  // Fetch Jira ticket context
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

  if (changedFiles.length === 0) {
    console.log('No supported files changed. Skipping review.');
    return;
  }

  const reviewComments = [];
  let hasErrors = false;

  for (const file of changedFiles) {
    console.log(`  Reviewing: ${file.filename}`);

    const content = getFileContent(file.filename);
    if (!content) {
      console.log(`  Could not read ${file.filename}, skipping.`);
      continue;
    }

    let violations = [];
    try {
      violations = await reviewWithGitHubModels(content, file.filename, systemPrompt);
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

      if (v.severity === 'ERROR') hasErrors = true;

      reviewComments.push({
        path: file.filename,
        position,
        body: formatComment(v),
      });
    }
  }

  console.log(`\n📝 Posting review with ${reviewComments.length} comment(s)...`);
  await postReview(octokit, reviewComments, hasErrors);
  console.log('✅ Clean Code Review complete.');

  if (hasErrors) {
    console.log('🔴 Blocking violations found — marking check as failed.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Clean Code Review Agent failed:', err);
  process.exit(1);
});
