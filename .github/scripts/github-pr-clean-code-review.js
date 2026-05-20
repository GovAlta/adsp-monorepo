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
// Build the system prompt with all 18 Clean Code rules
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(config, jiraContext) {
  const jiraSection = jiraContext
    ? `\nJIRA CONTEXT:\nThe following Jira ticket(s) are associated with this PR: ${jiraContext}. Use this as additional context to verify whether the code correctly implements the requirements described in the ticket.\n`
    : '';

  return `You are a Clean Code AI reviewer. Review the provided code and identify violations of the following rules.

RULES:
NAMING STABILITY PRINCIPLE:
Naming comments are SUGGESTION severity only — never ERROR or WARNING.
Do not flag a name merely because another name is also reasonable.
Do not reverse a previous naming suggestion unless it was clearly wrong.
If both names are acceptable, prefer the existing name to avoid churn.
Prefer stable, readable code over theoretically perfect names.

2.1  Function Names: Only flag a function name when it is clearly misleading, ambiguous in its local scope, or likely to cause a real maintenance problem. Do not suggest a rename merely because another name is also reasonable. Before flagging, compare the name against its local context, nearby function names, and existing project naming conventions. If the current name is acceptable in context, do not comment. Every naming suggestion must include: (1) why the existing name is harmful or confusing, (2) why the proposed name is better, (3) whether the change is required or optional polish. If the reason is preference only, do not leave the comment. Never reverse a previous naming suggestion unless the original was clearly wrong. If both names are acceptable, prefer the existing name to avoid churn.
2.2  File Names: Flag if the file name does not clearly reflect its purpose (comment at line 1).
2.3  Function Length: No function should exceed ${config.function_length_limit} lines. For React/TSX, suggest extracting loops or conditional blocks into separate components. REACT GUIDANCE: Do not suggest moving a React hook call itself out of a component. For long hook bodies, apply the dependency burden rule — only suggest extraction if the extracted code has a clean boundary with few parameters. Do not count JSX return blocks toward function length when rendering is the component's primary purpose.
2.4  Long Conditionals: Complex conditions should be wrapped in a named function that describes what is being tested.
2.5  Reusability: Flag duplicate or near-duplicate logic that could be extracted into a shared reusable function.
2.6  Encapsulation: If multiple functions operate on the same data, suggest creating a class or interface to encapsulate them.
2.7  Minimize Coupling: Each file should have one clear purpose. Flag files with mixed concerns.
2.8  Maximize Cohesion: If a single task is spread across multiple functions unnecessarily, suggest consolidation.
2.9  Meaningful Names: Variables, classes, and constants must have intention-revealing names. No magic numbers. No single-letter variables except loop counters. Only suggest a rename when the current name is clearly misleading or ambiguous in its local scope — not because another name might also be reasonable. Check the surrounding context before flagging: if the scope already makes the meaning clear, the name is acceptable. Every naming suggestion must justify why the existing name causes confusion and why the new name is concretely better. If both names are acceptable, prefer the existing name. Apply the stability principle: prefer stable readable code over theoretically perfect names. Avoid suggestions that would cause churn without improving correctness, clarity, or maintainability.
2.10 Functions Do One Thing: A function must do one thing only (Single Responsibility Principle). Flag functions doing multiple things. REACT GUIDANCE: Do not flag React components merely for combining state, effects, and rendering — this is correct React design. Only flag Rule 2.10 for non-React functions doing clearly unrelated things, or for React components where concerns are so mixed that splitting would genuinely improve clarity without increasing coupling.
2.11 Comments: Flag redundant comments that restate what the code does. Flag outdated or misleading comments. Do not comment bad code — rewrite it. Comments that explain design decisions are acceptable and encouraged — e.g. why something was implemented one way instead of another.
2.13 Error Handling: Use exceptions instead of returning error codes. Never suppress or silently ignore errors.
2.14 DRY Principle: Flag any duplicated logic. If the same logic appears more than once, extract it.
2.15 Classes Single Responsibility: Classes should have one reason to change. Flag classes with multiple concerns.
2.16 Unit Tests: Flag any exported function or class that has no corresponding test.
2.17 Testable Code: Flag functions that are too large or tightly coupled to be independently testable.
2.18 No Hidden Side Effects: Flag functions that modify external state unexpectedly or produce outputs not indicated by their name.

REACT PATTERNS — REVIEW GUIDANCE:
React hooks (useEffect, useMemo, useCallback, useState, useRef, useContext)
must never be moved to a regular helper file or non-hook function.
Hook calls must always remain inside a React component or a custom hook.

For useEffect, useMemo, useCallback bodies — review the code INSIDE
the hook separately using these rules:

- If the logic inside is pure and does not depend heavily on component
  state, props, refs, or dispatch functions → suggest extracting it to
  a helper function.
- If the effect represents a reusable behaviour with clear inputs and
  outputs → suggest extracting it to a custom hook.
- If the effect is tightly coupled to many local variables → do not
  suggest extraction unless you can show a clean function signature.
- If extraction would require passing many variables just to recreate
  the component's local scope → prefer suggesting smaller internal
  helper functions or simplifying the effect in place.
- Avoid vague comments like "move this useEffect elsewhere."

DEPENDENCY BURDEN RULE — apply before suggesting any extraction:
If the extracted function would require many parameters, many setters,
refs, dispatch functions, or locally scoped callbacks — do not recommend
moving it to another file.
Instead suggest one of:
- split the effect into multiple effects by responsibility
- create small named helper functions inside the component
- reduce the number of responsibilities in the effect
- derive values before the effect runs
- move pure transformation logic out, while leaving side-effect
  orchestration in place
Do not suggest extraction unless the extracted code has a clean boundary.

GENERAL REACT RULES:
- JSX return blocks — rendering is the component's primary responsibility,
  do not flag for length unless the component has clearly unrelated concerns
- Components combining state + effects + rendering — this is correct React
  design, not an SRP violation
- Backend service functions making one axios call, logging, and returning
  data — intentionally simple, do not flag for complexity or length unless
  they genuinely exceed the function_length_limit

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

  const commitsResponse = await octokit.rest.pulls.listCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: PR_NUMBER,
  });
  if (commitsResponse.data.length > 1) {
    console.log('Skipping review — already reviewed on first push.');
    return;
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

  console.log(`\n📝 Posting review with ${reviewComments.length} comment(s)...`);
  await postReviewSummary(octokit, reviewComments, hasBlockingViolations);
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
};
