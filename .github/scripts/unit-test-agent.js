/**
 * unit-test-agent.js
 * Unit Test AI Agent — ADSP Monorepo (CS-4943)
 *
 * Generates, reviews, and improves unit tests using the GitHub Models API.
 * Supports local mode (--file / --project) and PR mode (--pr).
 *
 * Usage:
 *   node .github/scripts/unit-test-agent.js --mode generate --file <path>
 *   node .github/scripts/unit-test-agent.js --mode review   --project <name>
 *   node .github/scripts/unit-test-agent.js --mode improve  --file <path> --dry-run
 *   node .github/scripts/unit-test-agent.js --mode generate --pr <number>
 */

const { Octokit } = require('@octokit/rest');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { fetchTicket } = require('./jira-client');

// ─────────────────────────────────────────────────────────────
// Environment
// ─────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const HEAD_SHA = process.env.HEAD_SHA;

// ─────────────────────────────────────────────────────────────
// Load agent config (.unittest.yml) — fall back to safe defaults
// ─────────────────────────────────────────────────────────────
function loadConfig() {
  const configPath = path.join(process.cwd(), '.unittest.yml');
  const defaults = {
    coverage_threshold: 80,
    test_runner: 'nx test',
    coverage_command: 'nx test --coverage',
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    test_suffix: '.spec',
    test_location: 'colocated',
    exclude_paths: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.tsx',
      '**/*.test.tsx',
      '**/*.spec.js',
      '**/*.test.js',
    ],
    disabled_modes: [],
  };

  if (!fs.existsSync(configPath)) {
    return defaults;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const lines = raw.split('\n');
    let currentList = null; // 'extensions' | 'exclude_paths' | 'disabled_modes' | null

    for (const line of lines) {
      // Skip blank lines and comments
      if (!line.trim() || line.trim().startsWith('#')) continue;

      // Detect the start of a block list
      if (/^\s*extensions\s*:/.test(line)) {
        currentList = 'extensions';
        defaults.extensions = [];
        continue;
      }
      if (/^\s*exclude_paths\s*:/.test(line)) {
        currentList = 'exclude_paths';
        defaults.exclude_paths = [];
        continue;
      }
      if (/^\s*disabled_modes\s*:/.test(line)) {
        currentList = 'disabled_modes';
        defaults.disabled_modes = [];
        continue;
      }

      // Consume a list item (- value or - 'value')
      const listMatch = line.match(/^\s+-\s*['"]?([^'"]+?)['"]?\s*$/);
      if (listMatch && currentList) {
        defaults[currentList].push(listMatch[1].trim());
        continue;
      }

      // A non-indented, non-list line closes the current list context
      if (currentList && !/^\s/.test(line)) {
        currentList = null;
      }

      // Scalar key: value pairs
      const scalar = line.match(/^\s*(\w+):\s*(.+)/);
      if (scalar) {
        currentList = null;
        const key = scalar[1].trim();
        const val = scalar[2].trim().replace(/^['"]|['"]$/g, '');
        if (key === 'coverage_threshold') defaults.coverage_threshold = parseInt(val, 10);
        if (key === 'test_runner') defaults.test_runner = val;
        if (key === 'coverage_command') defaults.coverage_command = val;
        if (key === 'test_suffix') defaults.test_suffix = val;
        if (key === 'test_location') defaults.test_location = val;
      }
    }
  } catch (e) {
    console.log('Could not parse .unittest.yml, using defaults');
  }

  return defaults;
}

// ─────────────────────────────────────────────────────────────
// Derive the colocated test file path for a given source file
// ─────────────────────────────────────────────────────────────
function resolveTestFilePath(sourceFile, config) {
  const ext = path.extname(sourceFile); // e.g. '.ts'
  const base = sourceFile.slice(0, -ext.length); // strip extension
  const suffix = config.test_suffix || '.test'; // e.g. '.test'
  // colocated: same folder, same name with suffix before the extension
  return `${base}${suffix}${ext}`;
}

// ─────────────────────────────────────────────────────────────
// Build the GPT system prompt — loads unit-testing.md at runtime
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(config, mode) {
  const skillsPath = path.join(process.cwd(), '.github', 'agents', 'unit-testing.md');
  let skillsContent = '';
  if (fs.existsSync(skillsPath)) {
    skillsContent = fs.readFileSync(skillsPath, 'utf8');
  } else {
    console.warn('Warning: .github/agents/unit-testing.md not found — using minimal prompt');
    skillsContent =
      'Write comprehensive Jest unit tests following the AAA pattern. One concept per test. No logic in tests. Colocate test files next to source files.';
  }

  const taskInstructions = {
    generate:
      'Generate a complete Jest unit test file for the provided source file. IMPORTANT: Only write tests for functions whose complete signature and body you can see in the source. If the source appears truncated, do not infer or guess function signatures — only test what is fully visible. Cover all exported functions and classes including edge cases and error paths. If an existing test file is provided, extend it rather than replacing it.',
    review:
      'Review the provided test file against the source. Identify gaps in coverage, AAA pattern violations, logic inside tests, missing edge cases, weak test names. IMPORTANT: Only test exported functions. Do not attempt to test private or unexported functions directly — they should be covered through the public API that calls them. Return fixed test file content.',
    improve:
      'Improve the provided test file. Fix AAA violations, add missing edge cases, strengthen test names. IMPORTANT: Only write tests for functions whose complete signature you can see in the source. Do not infer signatures for functions not visible in the truncation window. Do not test private or unexported functions directly.',
  };

  return `You are a Unit Test AI Agent for the ADSP monorepo.
Mode: ${mode.toUpperCase()}
Coverage threshold: ${config.coverage_threshold}%

SKILLS REFERENCE:
${skillsContent}

TASK:
${taskInstructions[mode] || taskInstructions.generate}

RESPONSE FORMAT:
Respond ONLY with a valid JSON object. No preamble, no explanation, no markdown fences. Structure:
{
  "testFilePath": "<relative path to the test file>",
  "testFileContent": "<complete test file content as a string>",
  "rationale": "<brief explanation of the test strategy and what is covered>",
  "coverageNote": "<estimated coverage percentage and any branches or paths that are intentionally not covered>"
}`;
}

// ─────────────────────────────────────────────────────────────
// Build the user prompt — assembles all context for the GPT call
// ─────────────────────────────────────────────────────────────
function buildUserPrompt(sourceFile, sourceContent, existingTestContent, jiraContext, prDiff) {
  const parts = [];

  if (jiraContext) {
    const jiraLines = ['JIRA CONTEXT:'];
    if (jiraContext.summary) jiraLines.push(`Summary: ${jiraContext.summary}`);
    if (jiraContext.description) jiraLines.push(`Description:\n${jiraContext.description}`);
    if (jiraContext.acceptanceCriteria) jiraLines.push(`Acceptance Criteria:\n${jiraContext.acceptanceCriteria}`);
    parts.push(jiraLines.join('\n'));
  }

  const truncatedSource =
    sourceContent.length > 4000 ? sourceContent.slice(0, 4000) + '\n// ... truncated for brevity' : sourceContent;
  parts.push(`SOURCE FILE: ${sourceFile}\n\`\`\`\n${truncatedSource}\n\`\`\``);

  if (existingTestContent) {
    const truncatedTest =
      existingTestContent.length > 2500
        ? existingTestContent.slice(0, 2500) + '\n// ... truncated for brevity'
        : existingTestContent;
    parts.push(`EXISTING TEST FILE:\n\`\`\`\n${truncatedTest}\n\`\`\``);
  }

  if (prDiff) {
    const truncatedDiff = prDiff.length > 1000 ? prDiff.slice(0, 1000) + '\n// ... truncated for brevity' : prDiff;
    parts.push(`PR DIFF (changed lines only):\n\`\`\`diff\n${truncatedDiff}\n\`\`\``);
  }

  return parts.join('\n\n');
}

// ─────────────────────────────────────────────────────────────
// Call GitHub Models API (free, uses GITHUB_TOKEN)
// ─────────────────────────────────────────────────────────────
async function callGPT(systemPrompt, userPrompt) {
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
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub Models API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Could not parse GPT response:', raw.slice(0, 200));
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Run nx test --coverage and check against the threshold
// ─────────────────────────────────────────────────────────────
function runCoverageCheck(config, projectName) {
  const cmd = `npx nx test ${projectName} --coverage --coverageReporters=text`;
  console.log(`  Running: ${cmd}`);

  let output = '';
  try {
    output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    // execSync throws on non-zero exit; capture stdout so we can still parse coverage numbers
    output = (e.stdout || '') + (e.stderr || '');
    console.warn(`  nx test exited non-zero for ${projectName}`);
  }

  // Istanbul text summary — look for "All files" row: All files | 85.71 | ...
  const allFilesMatch = output.match(/All files\s*\|\s*([\d.]+)/);
  if (allFilesMatch) {
    const coverage = parseFloat(allFilesMatch[1]);
    return { pass: coverage >= config.coverage_threshold, coverage };
  }

  // Fallback: look for a "Statements : XX%" line
  const statementsMatch = output.match(/Statements\s*:\s*([\d.]+)/);
  if (statementsMatch) {
    const coverage = parseFloat(statementsMatch[1]);
    return { pass: coverage >= config.coverage_threshold, coverage };
  }

  console.warn('  Could not parse coverage output — check the HTML report manually');
  return { pass: false, coverage: 0 };
}

// ─────────────────────────────────────────────────────────────
// Extract the Jira ticket ID from the PR title or body
// Same regex as github-pr-clean-code-review.js
// ─────────────────────────────────────────────────────────────
function extractJiraTicket(prTitle, prBody) {
  const jiraPattern = /[A-Z]+-\d+/g;
  const titleMatches = (prTitle || '').match(jiraPattern) || [];
  const bodyMatches = (prBody || '').match(jiraPattern) || [];
  const ticketIds = [...new Set([...titleMatches, ...bodyMatches])];
  return ticketIds.length > 0 ? ticketIds.join(', ') : null;
}

// ─────────────────────────────────────────────────────────────
// Format a PR comment body for the test agent output
// ─────────────────────────────────────────────────────────────
function formatPrComment(sourceFile, testFilePath, testFileContent, rationale, coverageNote, mode) {
  return `🧪 **Unit Test Agent (${mode})** — \`${sourceFile}\`

**Test file:** \`${testFilePath}\`

${rationale ? `**Strategy:** ${rationale}\n` : ''}
${coverageNote ? `**Coverage note:** ${coverageNote}\n` : ''}
<details>
<summary>Generated test file content</summary>

\`\`\`typescript
${testFileContent}
\`\`\`

</details>

<sub>Generated by unit-test-agent.js (CS-4943) · Review before committing · Do not merge automatically</sub>`;
}

// ─────────────────────────────────────────────────────────────
// Determine whether a file is a test or spec file
// ─────────────────────────────────────────────────────────────
function isTestFile(filePath) {
  return /\.(test|spec)\.[jt]sx?$/.test(filePath);
}

// ─────────────────────────────────────────────────────────────
// Check whether a file path matches any of the config exclude_paths globs
// ─────────────────────────────────────────────────────────────
function isExcluded(filePath, config) {
  const normalised = filePath.replace(/\\/g, '/');
  return config.exclude_paths.some((pattern) => {
    // dir/** patterns: match anything inside that directory
    if (pattern.endsWith('/**')) {
      const dir = pattern.slice(0, -3);
      return normalised.includes(`/${dir}/`) || normalised.startsWith(`${dir}/`);
    }
    // **/*.ext patterns: match any file with that suffix
    if (pattern.startsWith('**/')) {
      const suffix = pattern.slice(3).replace(/^\*/, ''); // '*.test.ts' → '.test.ts'
      return normalised.endsWith(suffix);
    }
    return normalised.includes(pattern);
  });
}

// ─────────────────────────────────────────────────────────────
// Recursively list all files under a directory
// ─────────────────────────────────────────────────────────────
function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// Find all source files in a project that have no matching test file
// ─────────────────────────────────────────────────────────────
function findUntestedFiles(projectName, config) {
  const candidates = [
    path.join(process.cwd(), 'apps', projectName, 'src'),
    path.join(process.cwd(), 'libs', projectName, 'src'),
  ];
  const srcRoot = candidates.find((p) => fs.existsSync(p));
  if (!srcRoot) {
    console.warn(`  Cannot find source root for project: ${projectName}`);
    return [];
  }

  return walkDir(srcRoot).filter((absPath) => {
    if (!config.extensions.includes(path.extname(absPath))) return false;
    if (isTestFile(absPath)) return false;

    const rel = path.relative(process.cwd(), absPath);
    const relNormalised = rel.replace(/\\/g, '/');
    if (isExcluded(relNormalised, config)) return false;

    const absTestPath = path.join(process.cwd(), resolveTestFilePath(relNormalised, config));
    return !fs.existsSync(absTestPath);
  });
}

// ─────────────────────────────────────────────────────────────
// Process a single source file: call GPT and write or print result
// ─────────────────────────────────────────────────────────────
async function processSourceFile(relativeSourcePath, args, config, systemPrompt, jiraTicket = null) {
  const absSourcePath = path.isAbsolute(relativeSourcePath)
    ? relativeSourcePath
    : path.join(process.cwd(), relativeSourcePath);

  if (!fs.existsSync(absSourcePath)) {
    console.warn(`  File not found: ${absSourcePath}`);
    return null;
  }

  const sourceContent = fs.readFileSync(absSourcePath, 'utf8');
  const testFilePath = resolveTestFilePath(relativeSourcePath, config);
  const absTestPath = path.join(process.cwd(), testFilePath);
  const existingTestContent = fs.existsSync(absTestPath) ? fs.readFileSync(absTestPath, 'utf8') : null;

  console.log(`  ${args.mode}: ${relativeSourcePath}`);
  if (existingTestContent) {
    console.log(`  Existing test file found: ${testFilePath}`);
  }

  const userPrompt = buildUserPrompt(relativeSourcePath, sourceContent, existingTestContent, jiraTicket, null);

  let result;
  try {
    result = await callGPT(systemPrompt, userPrompt);
  } catch (e) {
    console.warn(`  Error calling GPT for ${relativeSourcePath}:`, e.message);
    return null;
  }

  if (!result || !result.testFileContent) {
    console.warn(`  GPT returned no test content for ${relativeSourcePath}`);
    return null;
  }

  const resolvedTestPath = result.testFilePath || testFilePath;

  if (args.dryRun) {
    console.log(`\n--- DRY RUN: ${resolvedTestPath} ---`);
    console.log(result.testFileContent);
    if (result.rationale) console.log(`\nRationale: ${result.rationale}`);
    if (result.coverageNote) console.log(`Coverage note: ${result.coverageNote}`);
    return result;
  }

  const outPath = path.join(process.cwd(), resolvedTestPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, result.testFileContent, 'utf8');
  console.log(`  ✅ Written: ${resolvedTestPath}`);
  if (result.rationale) console.log(`  Rationale: ${result.rationale}`);
  if (result.coverageNote) console.log(`  Coverage note: ${result.coverageNote}`);

  return result;
}

// ─────────────────────────────────────────────────────────────
// Local mode — handles --file and --project
// ─────────────────────────────────────────────────────────────
async function runLocalMode(args, config) {
  console.log(`🧪 Unit Test Agent — local mode (${args.mode})`);

  if (config.disabled_modes.includes(args.mode)) {
    console.log(`Mode "${args.mode}" is disabled in .unittest.yml — exiting.`);
    return;
  }

  const systemPrompt = buildSystemPrompt(config, args.mode);

  const jiraTicket = args.ticket ? await fetchTicket(args.ticket) : null;
  if (jiraTicket) {
    console.log(`  Jira ticket: ${args.ticket} — ${jiraTicket.summary || '(no summary)'}`);
  }

  if (args.file) {
    const result = await processSourceFile(args.file, args, config, systemPrompt, jiraTicket);

    if (result && !args.dryRun) {
      // Infer project name from the file path — apps/<project>/... or libs/<project>/...
      const parts = args.file.replace(/\\/g, '/').split('/');
      const projectName = parts.length >= 2 ? parts[1] : null;
      if (projectName) {
        console.log(`\n📊 Running coverage check for ${projectName}...`);
        const { pass, coverage } = runCoverageCheck(config, projectName);
        const icon = pass ? '✅' : '⚠️ ';
        console.log(`  ${icon} Coverage: ${coverage}% (threshold: ${config.coverage_threshold}%)`);
      }
    }
    return;
  }

  if (args.project) {
    const untestedFiles = findUntestedFiles(args.project, config);
    if (untestedFiles.length === 0) {
      console.log(`  ✅ No untested source files found in ${args.project}`);
      return;
    }

    console.log(`  Found ${untestedFiles.length} untested file(s) in ${args.project}`);
    for (const absPath of untestedFiles) {
      const rel = path.relative(process.cwd(), absPath).replace(/\\/g, '/');
      await processSourceFile(rel, args, config, systemPrompt, jiraTicket);
    }

    if (!args.dryRun) {
      console.log(`\n📊 Running coverage check for ${args.project}...`);
      const { pass, coverage } = runCoverageCheck(config, args.project);
      const icon = pass ? '✅' : '⚠️ ';
      console.log(`  ${icon} Coverage: ${coverage}% (threshold: ${config.coverage_threshold}%)`);
    }
    return;
  }

  console.error('❌ Local mode requires --file or --project');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// PR mode — handles --pr
// ─────────────────────────────────────────────────────────────
async function runPrMode(args, config) {
  console.log(`🧪 Unit Test Agent — PR mode (${args.mode}), PR #${args.pr}`);

  if (config.disabled_modes.includes(args.mode)) {
    console.log(`Mode "${args.mode}" is disabled in .unittest.yml — exiting.`);
    return;
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const prNumber = parseInt(args.pr, 10);

  // Fetch PR metadata to extract Jira ticket and head SHA
  const prData = await octokit.rest.pulls.get({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
  });
  const ticketId = extractJiraTicket(prData.data.title, prData.data.body);
  const jiraTicket = ticketId ? await fetchTicket(ticketId) : null;
  if (jiraTicket) {
    console.log(`  Jira ticket: ${ticketId} — ${jiraTicket.summary || '(no summary)'}`);
  } else if (ticketId) {
    console.log(`  Jira ticket ID found (${ticketId}) but fetch returned null — continuing without Jira context`);
  }
  const headSha = HEAD_SHA || prData.data.head.sha;

  // Fetch changed files and filter to supported source extensions
  const filesRes = await octokit.rest.pulls.listFiles({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });
  const changedFiles = filesRes.data.filter((f) => {
    if (f.status === 'removed') return false;
    if (isTestFile(f.filename)) return false;
    if (isExcluded(f.filename, config)) return false;
    return config.extensions.includes(path.extname(f.filename));
  });

  if (changedFiles.length === 0) {
    console.log('  No supported source files changed — nothing to process.');
    return;
  }

  console.log(`  Files to process: ${changedFiles.length}`);

  const systemPrompt = buildSystemPrompt(config, args.mode);
  const prComments = [];

  for (const file of changedFiles) {
    console.log(`  Processing: ${file.filename}`);

    // Fetch full source file content from the PR head commit
    let sourceContent = file.patch || '';
    try {
      const contentRes = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file.filename,
        ref: headSha,
      });
      if (contentRes.data.content) {
        sourceContent = Buffer.from(contentRes.data.content, 'base64').toString('utf8');
      }
    } catch (e) {
      console.warn(`  Could not fetch full content for ${file.filename}, using diff`);
    }

    // Fetch the colocated test file from the repo if it exists
    const testFilePath = resolveTestFilePath(file.filename, config);
    let existingTestContent = null;
    try {
      const testRes = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: testFilePath,
        ref: headSha,
      });
      if (testRes.data.content) {
        existingTestContent = Buffer.from(testRes.data.content, 'base64').toString('utf8');
      }
    } catch (e) {
      // No existing test file — expected for generate mode
    }

    const userPrompt = buildUserPrompt(
      file.filename,
      sourceContent,
      existingTestContent,
      jiraTicket,
      file.patch || null,
    );

    let result;
    try {
      result = await callGPT(systemPrompt, userPrompt);
    } catch (e) {
      console.warn(`  Error calling GPT for ${file.filename}:`, e.message);
      continue;
    }

    if (!result || !result.testFileContent) {
      console.warn(`  GPT returned no test content for ${file.filename}`);
      continue;
    }

    prComments.push({
      sourceFile: file.filename,
      testFilePath: result.testFilePath || testFilePath,
      testFileContent: result.testFileContent,
      rationale: result.rationale,
      coverageNote: result.coverageNote,
    });
  }

  if (prComments.length === 0) {
    console.log('  No test output to post.');
    return;
  }

  if (args.dryRun) {
    for (const c of prComments) {
      console.log(`\n--- DRY RUN: ${c.testFilePath} ---`);
      console.log(c.testFileContent);
    }
    return;
  }

  // Post one PR issue comment per processed file
  for (const c of prComments) {
    const body = formatPrComment(
      c.sourceFile,
      c.testFilePath,
      c.testFileContent,
      c.rationale,
      c.coverageNote,
      args.mode,
    );
    await octokit.rest.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: prNumber,
      body,
    });
    console.log(`  💬 Posted comment for ${c.sourceFile}`);
  }

  console.log(`✅ Unit Test Agent complete — ${prComments.length} comment(s) posted.`);
}

// ─────────────────────────────────────────────────────────────
// CLI argument parser
// ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    mode: null,
    file: null,
    project: null,
    ticket: null,
    pr: null,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--mode':
        args.mode = argv[++i];
        break;
      case '--file':
        args.file = argv[++i];
        break;
      case '--project':
        args.project = argv[++i];
        break;
      case '--ticket':
        args.ticket = argv[++i];
        break;
      case '--pr':
        args.pr = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
    }
  }

  return args;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();

  const VALID_MODES = ['generate', 'review', 'improve'];
  if (!args.mode || !VALID_MODES.includes(args.mode)) {
    console.error(`❌ --mode is required. Valid values: ${VALID_MODES.join(', ')}`);
    process.exit(1);
  }

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  if (args.pr) {
    await runPrMode(args, config);
  } else {
    await runLocalMode(args, config);
  }
}

// Guard against auto-execution when this module is require()'d by the test suite
if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Unit Test Agent failed:', err);
    process.exit(1);
  });
}

module.exports = {
  loadConfig,
  resolveTestFilePath,
  buildSystemPrompt,
  buildUserPrompt,
  callGPT,
  runCoverageCheck,
};
