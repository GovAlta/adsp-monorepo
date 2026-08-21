#!/usr/bin/env node
// Release diff collector.
//
// Determines what code each ADSP service is running in prod and uat, and what has
// landed on main since. Read-only: it queries GitHub Actions run history and the
// local git history, and never touches a cluster.
//
// How the environment SHAs are derived
// ------------------------------------
// Deployment moves images by tag, never by rebuild (.github/actions/deploy-app):
//
//   delivery-ci   build -> ghcr image tagged `latest` and `<github.sha>`
//                 deployDev      : oc tag <app>:latest -> <app>:dev
//                 deployStaging  : oc tag <app>:dev    -> <app>:uat
//   promote       deployProduction: oc tag <app>:uat   -> <app>:prod
//
// So the commit running in an environment is the head SHA of the workflow run that
// last moved that tag:
//
//   uat(app)  = head SHA of the newest successful `deployStaging (<app>)` job
//   prod(app) = head SHA of the newest successful `deployStaging (<app>)` job that
//               completed BEFORE the newest successful `deployProduction (<app>)` job
//
// Job conclusions matter, not run conclusions: promote runs frequently end in
// `failure` because a post-deploy smoke test failed after the deploy job succeeded.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const CACHE_DIR = join(HERE, '.cache');
const CACHE_FILE = join(CACHE_DIR, 'jobs.json');

const PROMOTE_WORKFLOW = 'promote.yml';
const DELIVERY_WORKFLOW = 'delivery-ci.yml';
const PROD_JOB = 'deployProduction';
const UAT_JOB = 'deployStaging';

const usage = `
Usage: node tools/release-diff/collect.mjs [options]

  --json <path>     Write the full JSON report (default: release-diff.json)
  --md <path>       Write the Markdown summary (default: release-diff.md)
  --service <name>  Limit to one service (repeatable)
  --ref <ref>       Compare against this ref (default: origin/main, else main)
  --no-deps         Skip nx dependency scoping (faster; own-app commits only)
  --max-runs <n>    Max delivery-ci runs to scan per phase (default: 150)
  --refresh         Ignore the cached job lookups and re-query GitHub
  --quiet           Suppress progress output
  -h, --help        Show this help

Requires the GitHub CLI, authenticated. In CI, set GH_TOKEN and grant
permissions: { contents: read, actions: read }, and checkout with fetch-depth: 0.
`.trim();

// ---------------------------------------------------------------- arg parsing

function parseArgs(argv) {
  const opts = {
    json: 'release-diff.json',
    md: 'release-diff.md',
    services: [],
    ref: null,
    deps: true,
    maxRuns: 150,
    refresh: false,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) {
        throw new Error(`${a} requires a value`);
      }
      return v;
    };
    switch (a) {
      case '--json': opts.json = next(); break;
      case '--md': opts.md = next(); break;
      case '--service': opts.services.push(next()); break;
      case '--ref': opts.ref = next(); break;
      case '--no-deps': opts.deps = false; break;
      case '--max-runs': opts.maxRuns = Number(next()); break;
      case '--refresh': opts.refresh = true; break;
      case '--quiet': opts.quiet = true; break;
      case '-h': case '--help': console.log(usage); process.exit(0); break;
      default: throw new Error(`Unknown option: ${a}\n\n${usage}`);
    }
  }
  return opts;
}

// ------------------------------------------------------------------- plumbing

let log = (msg) => process.stderr.write(`${msg}\n`);

function git(args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Long scans hit 502s, secondary rate limits, and HTTP/2 stream resets. The failure
// modes are too varied to allowlist, so retry everything except errors that will never
// succeed on a retry — a single blip must not discard hundreds of completed calls.
const PERMANENT_ERROR = /HTTP (40[0-9]|41\d|422)|not found|authentication|gh auth|Bad credentials/i;

function gh(args, { attempts = 5 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return execFileSync('gh', args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (err) {
      lastError = err;
      const stderr = String(err.stderr ?? '');
      // 429 is a rate limit: transient despite being a 4xx.
      const permanent = PERMANENT_ERROR.test(stderr) && !/HTTP 429/.test(stderr);
      if (permanent || attempt === attempts) {
        break;
      }
      const backoff = 1000 * 2 ** (attempt - 1);
      log(`  ! ${stderr.trim().split('\n')[0]} — retrying in ${backoff / 1000}s (${attempt}/${attempts - 1})`);
      sleepSync(backoff);
    }
  }
  throw lastError;
}

function ghJson(args) {
  const out = gh(args).trim();
  if (!out) {
    return null;
  }
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

// Completed runs are immutable, so their job lists can be cached indefinitely.
function loadCache(refresh) {
  if (refresh || !existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
}

// ------------------------------------------------------- github actions layer

function repoSlug() {
  const slug = ghJson(['repo', 'view', '--json', 'nameWithOwner']);
  if (!slug?.nameWithOwner) {
    throw new Error('Could not determine the repository. Is `gh` authenticated and this a GitHub remote?');
  }
  return slug.nameWithOwner;
}

let uncachedFetches = 0;
// Module-level handle so an aborted run still persists what it already fetched.
let jobCache = null;

/** Deploy jobs for one run, keyed by run id and cached. */
function deployJobs(repo, runId, cache) {
  const key = String(runId);
  if (!cache[key]) {
    const jobs = ghJson([
      'api', '-X', 'GET', `/repos/${repo}/actions/runs/${runId}/jobs`,
      '-F', 'per_page=100',
      '-q', '[.jobs[] | select(.name | startswith("deploy")) | {name, conclusion}]',
    ]) ?? [];
    // Store compactly: "conclusion|name".
    cache[key] = jobs.map((j) => `${j.conclusion}|${j.name}`);
    // Checkpoint regularly so an interrupted scan resumes instead of restarting.
    if (++uncachedFetches % 25 === 0) {
      saveCache(cache);
    }
  }
  return cache[key].map((entry) => {
    const idx = entry.indexOf('|');
    return { conclusion: entry.slice(0, idx), name: entry.slice(idx + 1) };
  });
}

/** App name out of a matrix job name like `deployStaging (form-service)`. */
function matrixApp(jobName, prefix) {
  if (!jobName.startsWith(`${prefix} (`) || !jobName.endsWith(')')) {
    return null;
  }
  return jobName.slice(prefix.length + 2, -1);
}

/**
 * Every run of a workflow, newest first.
 *
 * Deliberately does NOT use the API's `created=<...>` filter: given a full ISO
 * timestamp it silently omits runs that fall inside the requested range (asking for
 * runs before 2026-08-12T17:23:38Z returns 2026-07-27 as the newest, skipping a real
 * run from 2026-08-07). A dropped run resolves a service to an older commit and
 * overstates how far behind production is. Date cutoffs are applied client-side.
 */
function listRuns(repo, workflow, { maxPages = 10 } = {}) {
  const runs = [];
  for (let page = 1; page <= maxPages; page++) {
    const batch = ghJson([
      'api', '-X', 'GET', `/repos/${repo}/actions/workflows/${workflow}/runs`,
      '-F', 'per_page=100', '-F', `page=${page}`,
      '-q', '[.workflow_runs[] | {id, created_at, head_sha}]',
    ]) ?? [];
    runs.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }
  runs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return runs;
}

/**
 * Newest successful promote of each app: when it was promoted, and the promote
 * run's own head SHA (an upper bound on the deployed commit, refined below).
 */
function findPromotions(repo, cache) {
  const promotions = {};
  for (const run of listRuns(repo, PROMOTE_WORKFLOW, { maxPages: 5 })) {
    for (const job of deployJobs(repo, run.id, cache)) {
      const app = matrixApp(job.name, PROD_JOB);
      if (app && job.conclusion === 'success' && !promotions[app]) {
        promotions[app] = { promotedAt: run.created_at, promoteRun: run.id };
      }
    }
  }
  return promotions;
}

/**
 * Newest successful staging deploy per wanted app, considering only runs that started
 * before `before` (pass null for "no cutoff"). Scans newest-first over an already
 * fetched run list and stops as soon as every wanted app is resolved, so the expensive
 * per-run job lookups are bounded by how quickly the apps are found.
 */
function findStagingDeploys(repo, runs, wanted, before, cache, maxRuns) {
  const remaining = new Set(wanted);
  const found = {};
  let scanned = 0;
  for (const run of runs) {
    if (remaining.size === 0 || scanned >= maxRuns) {
      break;
    }
    if (before && run.created_at >= before) {
      continue; // client-side cutoff; see listRuns
    }
    scanned++;
    for (const job of deployJobs(repo, run.id, cache)) {
      if (job.conclusion !== 'success') {
        continue;
      }
      const app = matrixApp(job.name, UAT_JOB);
      if (app && remaining.has(app)) {
        found[app] = { sha: run.head_sha, deployedAt: run.created_at, ciRun: run.id };
        remaining.delete(app);
      }
    }
  }
  return found;
}

/** Apps in the workspace, which together with promoted apps bounds the uat search. */
function workspaceApps() {
  const appsDir = join(REPO_ROOT, 'apps');
  if (!existsSync(appsDir)) {
    return [];
  }
  return readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.endsWith('-e2e'))
    .map((e) => e.name);
}

// ------------------------------------------------------------ dependency graph

/**
 * Source paths that get baked into an app's image: the app itself plus every
 * workspace library it transitively depends on. Without this, an app whose own
 * directory barely changed can look current while the renderer inside it moved
 * hundreds of commits.
 */
function dependencyPaths(quiet) {
  const out = join(CACHE_DIR, 'graph.json');
  mkdirSync(CACHE_DIR, { recursive: true });
  if (!quiet) {
    log('  generating nx project graph (this takes a moment)...');
  }
  try {
    // Run nx's entrypoint through node rather than the npx shim: Node refuses to
    // spawn .cmd shims without shell:true on Windows, and shell:true with arguments
    // is deprecated (DEP0190).
    const nxBin = join(REPO_ROOT, 'node_modules', 'nx', 'dist', 'bin', 'nx.js');
    if (!existsSync(nxBin)) {
      throw new Error(`nx not found at ${nxBin} — run npm ci`);
    }
    execFileSync(process.execPath, [nxBin, 'graph', '--file', out], {
      cwd: REPO_ROOT,
      stdio: 'ignore',
    });
  } catch (err) {
    // Falling back silently would understate change in every app with shared deps,
    // so name the cause: this degrades the report, it does not just skip an extra.
    log(`  ! nx graph failed (${err.message.split('\n')[0]})`);
    log('    falling back to own-app paths only — dependency change is NOT counted');
    return null;
  }
  const raw = JSON.parse(readFileSync(out, 'utf8'));
  const graph = raw.graph ?? raw;
  const { nodes, dependencies } = graph;

  const resolve = (project, seen = new Set()) => {
    for (const dep of dependencies[project] ?? []) {
      const target = dep.target;
      if (target.startsWith('npm:') || seen.has(target)) {
        continue;
      }
      seen.add(target);
      resolve(target, seen);
    }
    return seen;
  };

  const paths = {};
  for (const name of Object.keys(nodes)) {
    const roots = [nodes[name].data.root];
    for (const dep of resolve(name)) {
      if (nodes[dep]?.data?.root) {
        roots.push(nodes[dep].data.root);
      }
    }
    paths[name] = [...new Set(roots)];
  }
  return paths;
}

// -------------------------------------------------------------- git history

const TICKET_RE = /\b(CS-\d+)\b/g;
const PR_RE = /\(#(\d+)\)/;

function commitsBetween(from, to, paths) {
  if (!from || !to) {
    return [];
  }
  const sep = '\x1f';
  let out;
  try {
    out = git([
      'log', '--no-merges', `--format=%H${sep}%ad${sep}%an${sep}%s`, '--date=short',
      `${from}..${to}`, '--', ...paths,
    ]);
  } catch {
    return [];
  }
  if (!out) {
    return [];
  }
  return out.split('\n').map((line) => {
    const [sha, date, author, subject = ''] = line.split(sep);
    return {
      sha: sha.slice(0, 9),
      date,
      author,
      subject,
      tickets: [...new Set(subject.match(TICKET_RE) ?? [])],
      pr: subject.match(PR_RE)?.[1] ?? null,
    };
  });
}

function resolveRef(preferred) {
  const candidates = preferred ? [preferred] : ['origin/main', 'main'];
  for (const ref of candidates) {
    try {
      git(['rev-parse', '--verify', `${ref}^{commit}`]);
      return ref;
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error(`Could not resolve a comparison ref (tried: ${candidates.join(', ')})`);
}

const missingCommits = new Set();

/** Whether the SHA exists in this clone. Absent SHAs are reported, never guessed. */
function haveCommit(sha) {
  try {
    return execFileSync('git', ['cat-file', '-t', sha], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() === 'commit';
  } catch {
    missingCommits.add(sha);
    return false;
  }
}

// -------------------------------------------------------------- deploy checks

/** git that yields '' instead of throwing — checks are best-effort, never fatal. */
function gitSafe(args) {
  try {
    return git(args);
  } catch {
    return '';
  }
}

/**
 * Deterministic answers to the questions a reviewer would otherwise have to open the
 * code to settle. These exist because the facts that decide a promotion are usually
 * invisible in commit subjects: "add sorting" does not say that promoting builds a
 * wildcard index over production data, and "add otel" does not say the exporter is
 * unconfigured and the instrumentation therefore inert.
 */
function detectChecks({ app, prodSha, refSha, ownPaths, commits }) {
  const checks = {};

  // --- Mongo indexes created on startup -------------------------------------
  // Mongoose builds schema-declared indexes at connection time when autoIndex is on,
  // so an index added in this range is work the pod does against production data.
  const added = gitSafe(['diff', '-U0', `${prodSha}..${refSha}`, '--', ...ownPaths])
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++') && l.includes('.index('))
    .map((l) => l.replace(/^\+\s*/, '').trim());
  if (added.length > 0) {
    const autoIndex = gitSafe(['grep', '-l', 'autoIndex: true', refSha, '--', ...ownPaths]) !== '';
    const wildcard = added.filter((d) => d.includes('$**'));
    checks.mongoIndexes = {
      added: added.length,
      wildcard: wildcard.length,
      builtOnStartup: autoIndex,
      declarations: added.slice(0, 12),
    };
  }

  // --- Container definition ---------------------------------------------------
  // A changed base image or runtime dependency can alter behaviour with no application
  // commit to show for it (fonts, browser engines, native libs). Own and shared
  // Dockerfiles are kept apart deliberately: nearly every service inherits the shared
  // ones, so reporting that per service would fire on the whole estate at once and
  // train readers to skip the warnings. The shared change is reported once, globally.
  const shared = ['.openshift/service/Dockerfile', '.openshift/app/Dockerfile'];
  const own = gitSafe([
    'diff', '--name-only', `${prodSha}..${refSha}`, '--', ...ownPaths,
  ]).split('\n').filter((f) => /Dockerfile/i.test(f));
  if (own.length > 0) {
    checks.containerChanged = { files: [...new Set(own)] };
  }
  const sharedTouched = gitSafe([
    'diff', '--name-only', `${prodSha}..${refSha}`, '--', ...shared,
  ]).split('\n').filter(Boolean);
  if (sharedTouched.length > 0) {
    checks.sharedContainerChanged = { files: [...new Set(sharedTouched)] };
  }

  // --- New environment variables ----------------------------------------------
  // A variable added to envalid without a default fails validation at startup. The
  // manifest is only half the answer: envFrom pulls the rest from a cluster secret
  // that is not in git, so an absent name is a question, not a verdict.
  const envFile = `${ownPaths[0]}/src/environments/environment.ts`;
  const envDiff = gitSafe(['diff', '-U0', `${prodSha}..${refSha}`, '--', envFile]);
  const names = [...envDiff.matchAll(/^\+\s*([A-Z][A-Z0-9_]*)\s*:\s*envalid\./gm)].map((m) => m[1]);
  if (names.length > 0) {
    const manifest = gitSafe(['show', `${refSha}:.openshift/managed/${app}.yml`]);
    const usesEnvFrom = manifest.includes('envFrom');
    const vars = [...new Set(names)].map((name) => ({
      name,
      inManifest: new RegExp(`name:\\s*${name}\\b`).test(manifest),
      // A variable with no envalid default must be supplied or the service will not start.
      hasDefault: new RegExp(`${name}\\s*:\\s*envalid\\.[a-z]+\\(\\s*\\{[^}]*default`).test(envDiff),
    }));
    const unaccounted = vars.filter((v) => !v.inManifest && !v.hasDefault);
    if (unaccounted.length > 0 || vars.length > 0) {
      checks.newEnvVars = { vars, usesEnvFrom, unaccounted: unaccounted.map((v) => v.name) };
    }
  }

  // --- Churn signal -------------------------------------------------------------
  // Reverts cluster around areas that were hard to get right; worth a closer look.
  const reverts = commits.filter((c) => /^revert\b|^\w+.*\brevert(ed|ing)?\b/i.test(c.subject));
  if (reverts.length > 0) {
    checks.reverts = { count: reverts.length, subjects: reverts.slice(0, 6).map((c) => c.subject) };
  }

  return checks;
}

// ------------------------------------------------------------------- coupling

/**
 * Services that have to be promoted together, derived from the commit record alone.
 *
 * Grouping uses ticket references only. Pull request numbers are reported as supporting
 * evidence but deliberately not used to group: a single library fix routinely touches
 * five apps in one PR, so grouping on PRs collapses most of the estate into one
 * meaningless blob. A ticket is feature-level and is the honest signal that two services
 * implement two halves of the same thing.
 */
function detectCoupling(services) {
  const behind = services.filter((s) => s.status === 'behind');

  const index = (key) => {
    const map = new Map();
    for (const s of behind) {
      for (const ref of s[key]) {
        if (!map.has(ref)) {
          map.set(ref, new Set());
        }
        map.get(ref).add(s.name);
      }
    }
    return [...map]
      .filter(([, v]) => v.size > 1)
      .map(([ref, v]) => ({ ref, services: [...v].sort() }))
      .sort((a, b) => b.services.length - a.services.length || String(a.ref).localeCompare(String(b.ref)));
  };

  const tickets = index('tickets');
  const prs = index('prs');

  // Union services that share a ticket, so a chain of tickets forms one group.
  const parent = new Map(behind.map((s) => [s.name, s.name]));
  const find = (a) => (parent.get(a) === a ? a : (parent.set(a, find(parent.get(a))), parent.get(a)));
  const union = (a, b) => parent.set(find(a), find(b));
  for (const { services: members } of tickets) {
    for (let i = 1; i < members.length; i++) {
      union(members[0], members[i]);
    }
  }

  const clusters = new Map();
  for (const s of behind) {
    const root = find(s.name);
    if (!clusters.has(root)) {
      clusters.set(root, []);
    }
    clusters.get(root).push(s.name);
  }

  const groups = [...clusters.values()]
    .filter((members) => members.length > 1)
    .map((members) => ({
      services: members.sort(),
      evidence: tickets
        .filter((t) => t.services.some((n) => members.includes(n)))
        .map((t) => ({ ticket: t.ref, services: t.services })),
    }))
    .sort((a, b) => b.services.length - a.services.length);

  // Pairs that are not in a ticket group but were still changed together.
  //
  // Two signals, both keyed on fan-out. A change touching two or three services is
  // usually one thing split across codebases; the same signal at five services is a
  // shared library fix rippling outward, which is not a promotion pairing. Commit type
  // filters the obvious housekeeping: a `chore` naming two services is one pass of
  // cleanup, not a coupling.
  //
  // What this deliberately does NOT claim is that a pair must ship together. A
  // cross-cutting change applied to several services at once looks identical here to a
  // feature split across them — `feat(form-service,event-service,file-service): add otel
  // trace` names three services and is not a coupling at all. Separating the two needs
  // the change read, so the evidence is reported and the judgement left to the reader.
  const MAX_FANOUT = 3;
  const inSameGroup = (members) =>
    groups.some((g) => members.every((n) => g.services.includes(n)));

  const pairs = new Map();
  const addPair = (members, strength, reason, evidence) => {
    const list = [...new Set(members)].sort();
    if (list.length < 2 || list.length > MAX_FANOUT || inSameGroup(list)) {
      return;
    }
    const key = list.join('|');
    // A scope pair is stronger evidence than a PR pair; keep the best one seen.
    if (!pairs.has(key) || strength === 'stated') {
      pairs.set(key, { services: list, strength, reason, evidence });
    }
  };

  const known = new Set(behind.map((s) => s.name));
  const seenCommits = new Set();
  for (const s of behind) {
    for (const c of s.commits.prodToMain) {
      if (seenCommits.has(c.sha)) {
        continue;
      }
      seenCommits.add(c.sha);
      const scope = /^(\w+)\(([^)]*)\)/.exec(c.subject);
      if (!scope || !/^(feat|fix)$/i.test(scope[1])) {
        continue;
      }
      const named = scope[2].split(',').map((p) => p.trim()).filter((p) => known.has(p));
      if (named.length > 1) {
        addPair(named, 'stated', 'one change, and the commit names both services', c.subject);
      }
    }
  }

  for (const p of prs) {
    if (p.services.length <= MAX_FANOUT) {
      addPair(p.services, 'likely', `one pull request (#${p.ref}) across these services`, `#${p.ref}`);
    }
  }

  return {
    groups,
    pairs: [...pairs.values()].sort((a, b) => (a.strength === b.strength ? 0 : a.strength === 'stated' ? -1 : 1)),
    sharedTickets: tickets,
    sharedPrs: prs,
  };
}

// ------------------------------------------------------------------ reporting

function classify(service) {
  if (!service.inRepo) {
    return 'orphaned';
  }
  if (!service.prod) {
    return 'never-promoted';
  }
  if (service.counts.prodToMain === 0) {
    return 'current';
  }
  return 'behind';
}

function summarizeTypes(commits) {
  const types = {};
  for (const c of commits) {
    const type = /^(\w+)(\(|:|!)/.exec(c.subject)?.[1] ?? 'other';
    types[type] = (types[type] ?? 0) + 1;
  }
  return types;
}

function daysBetween(iso, now) {
  if (!iso) {
    return null;
  }
  return Math.round((now - new Date(iso)) / 86400000);
}

/** Human-readable warnings from the deterministic checks, worst first. */
function checkNotes(s) {
  const c = s.checks ?? {};
  const notes = [];
  if (c.mongoIndexes) {
    const { added, wildcard, builtOnStartup } = c.mongoIndexes;
    const what = `**${added} database index${added === 1 ? '' : 'es'} added**${wildcard ? ` (${wildcard} wildcard)` : ''}`;
    notes.push(builtOnStartup
      ? `${what} — built against production data on first start (\`autoIndex\` is enabled). Promote off-peak and watch the database.`
      : `${what} — \`autoIndex\` is not enabled, so these must be created deliberately.`);
  }
  if (c.newEnvVars?.unaccounted?.length) {
    notes.push(`**New required configuration**: \`${c.newEnvVars.unaccounted.join('`, `')}\` — no default and not in the manifest.${c.newEnvVars.usesEnvFrom ? ' The manifest uses `envFrom`, so it may come from a cluster secret; confirm it exists in prod.' : ' The service will fail startup validation without it.'}`);
  }
  if (c.containerChanged) {
    notes.push(`**This service's own container changed** (${c.containerChanged.files.join(', ')}) — runtime behaviour can differ with no application change to explain it.`);
  }
  if (c.reverts) {
    notes.push(`**${c.reverts.count} revert${c.reverts.count === 1 ? '' : 's'}** in this range — that area churned.`);
  }
  return notes;
}

function toMarkdown(report) {
  const L = [];
  const behind = report.services.filter((s) => s.status === 'behind');
  const current = report.services.filter((s) => s.status === 'current');
  const other = report.services.filter((s) => s.status !== 'behind' && s.status !== 'current');

  behind.sort((a, b) => b.counts.prodToMainScoped - a.counts.prodToMainScoped);

  L.push('# Release diff: production vs main');
  L.push('');
  L.push(`Generated ${report.generatedAt} · comparing \`${report.ref}\` (\`${report.refSha.slice(0, 9)}\`) against production.`);
  L.push('');
  L.push(`**${behind.length}** of ${report.services.length} services differ from production. **${current.length}** ${current.length === 1 ? 'is' : 'are'} current.`);
  L.push('');
  if (!report.dependencyScoped) {
    L.push('> Dependency scoping was skipped (`--no-deps`). Counts cover each app\'s own directory only, which understates change in apps that depend on shared libraries.');
    L.push('');
  }

  // Coupled groups lead: shipping half of one leaves a UI calling endpoints prod lacks.
  const coupling = report.coupling ?? { groups: [], sharedPrs: [] };
  if (coupling.groups.length > 0) {
    L.push('## Promote together');
    L.push('');
    L.push('These services implement two halves of the same work. Promoting one without the others leaves the deployed half calling something production does not have.');
    L.push('');
    for (const g of coupling.groups) {
      L.push(`- **${g.services.join(' + ')}**`);
      for (const e of g.evidence) {
        L.push(`  - \`${e.ticket}\` spans ${e.services.join(', ')}`);
      }
    }
    L.push('');
  }
  if (coupling.pairs?.length > 0) {
    L.push('## Changed together — check whether they must ship together');
    L.push('');
    L.push('Couplings too small for the groups above. The evidence matters: a feature split across services has to ship as one, while the same mechanical change applied to several services at once does not. The commit text tells you which — this cannot be decided from the shape of the data alone.');
    L.push('');
    const stated = coupling.pairs.filter((p) => p.strength === 'stated');
    const likely = coupling.pairs.filter((p) => p.strength !== 'stated');
    if (stated.length > 0) {
      L.push('**Named together in one commit**');
      L.push('');
      for (const p of stated) {
        L.push(`- **${p.services.join(' + ')}** — \`${p.evidence}\``);
      }
      L.push('');
    }
    if (likely.length > 0) {
      L.push('**Changed in one pull request**');
      L.push('');
      for (const p of likely) {
        L.push(`- **${p.services.join(' + ')}** — ${p.evidence}`);
      }
      L.push('');
    }
  }

  if (coupling.sharedPrs.length > 0) {
    L.push('<details><summary>Wider shared pull requests (fan-out above 3 — a shared library change, not a promotion pairing)</summary>');
    L.push('');
    for (const p of coupling.sharedPrs.filter((p) => p.services.length > 3).slice(0, 20)) {
      L.push(`- #${p.ref} — ${p.services.join(', ')}`);
    }
    L.push('');
    L.push('</details>');
    L.push('');
  }

  // Deploy-time consequences lead, because they are the part a commit list hides.
  const sharedContainer = behind.filter((s) => s.checks?.sharedContainerChanged);
  if (sharedContainer.length > 0) {
    const files = [...new Set(sharedContainer.flatMap((s) => s.checks.sharedContainerChanged.files))];
    L.push('## Platform-wide');
    L.push('');
    L.push(`The shared container definitions (${files.map((f) => `\`${f}\``).join(', ')}) changed since **${sharedContainer.length}** services were last built. Every service that inherits them picks the change up on its next promotion, whatever else is in its range — worth reviewing once rather than per service.`);
    L.push('');
  }

  const flagged = behind.filter((s) => checkNotes(s).length > 0);
  if (flagged.length > 0) {
    L.push('## Promoting these has deploy-time consequences');
    L.push('');
    for (const s of flagged) {
      L.push(`**${s.name}**`);
      L.push('');
      for (const line of checkNotes(s)) {
        L.push(`- ${line}`);
      }
      L.push('');
    }
  }

  L.push('## Services that differ');
  L.push('');
  const depCol = report.dependencyScoped ? ' +deps |' : '';
  const depAlign = report.dependencyScoped ? '---:|' : '';
  L.push(`| Service | Prod since | Age | Prod SHA | Own |${depCol} Ahead of uat |`);
  L.push(`|---|---|---|---:|---:|${depAlign}---:|`);
  for (const s of behind) {
    const dep = report.dependencyScoped ? ` ${s.counts.prodToMainScoped} |` : '';
    L.push(`| ${s.name} | ${s.prod.deployedAt.slice(0, 10)} | ${s.prodAgeDays}d | \`${s.prod.sha.slice(0, 9)}\` | ${s.counts.prodToMain} |${dep} ${s.counts.uatToMain} |`);
  }
  L.push('');

  if (current.length) {
    L.push('## Current in production');
    L.push('');
    L.push(current.map((s) => `\`${s.name}\``).join(' · '));
    L.push('');
  }

  if (other.length) {
    L.push('## Needs attention');
    L.push('');
    for (const s of other) {
      const note = s.status === 'orphaned'
        ? 'deployed in production but no longer present in the repository'
        : 'exists in the repository but has never been promoted to production';
      L.push(`- **${s.name}** — ${note}`);
    }
    L.push('');
  }

  L.push('## Detail');
  L.push('');
  for (const s of behind) {
    const compare = `${report.repoUrl}/compare/${s.prod.sha}...${report.refSha}`;
    L.push('<details>');
    const heading = report.dependencyScoped
      ? `${s.counts.prodToMain} own commits, ${s.counts.prodToMainScoped} including dependencies`
      : `${s.counts.prodToMain} commits`;
    L.push(`<summary><strong>${s.name}</strong> — ${heading}</summary>`);
    L.push('');
    L.push(`Production runs \`${s.prod.sha.slice(0, 9)}\`, built ${s.prod.deployedAt.slice(0, 10)} and promoted ${s.prod.promotedAt.slice(0, 10)}.`);
    L.push('');
    L.push(`[Full compare on GitHub](${compare})`);
    L.push('');
    const types = summarizeTypes(s.commits.prodToMain);
    if (Object.keys(types).length) {
      L.push(`Change mix: ${Object.entries(types).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
      L.push('');
    }
    if (s.tickets.length) {
      L.push(`Tickets: ${s.tickets.join(', ')}`);
      L.push('');
    }
    const notes = checkNotes(s);
    if (notes.length > 0) {
      for (const line of notes) {
        L.push(`- ${line}`);
      }
      L.push('');
    }
    const deps = Object.entries(s.dependencyBreakdown ?? {}).sort((a, b) => b[1] - a[1]);
    if (deps.length > 0) {
      L.push(`Shared libraries changed: ${deps.map(([p, n]) => `${p} (${n})`).join(' · ')}`);
      L.push('');
    }
    for (const c of s.commits.prodToMain) {
      L.push(`- \`${c.sha}\` ${c.date} — ${c.subject}`);
    }
    L.push('');
    L.push('</details>');
    L.push('');
  }
  return L.join('\n');
}

// ----------------------------------------------------------------------- main

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.quiet) {
    log = () => {};
  }

  const repo = repoSlug();
  const repoUrl = `https://github.com/${repo}`;
  const ref = resolveRef(opts.ref);
  const refSha = git(['rev-parse', ref]);
  const cache = loadCache(opts.refresh);
  jobCache = cache;
  const now = new Date();

  log(`repo ${repo} · comparing against ${ref} (${refSha.slice(0, 9)})`);

  log('resolving production promotions...');
  const promotions = findPromotions(repo, cache);
  saveCache(cache);
  log(`  ${Object.keys(promotions).length} apps with a successful production deploy`);

  // Group by promote timestamp so each cohort needs only one backward scan.
  const cohorts = new Map();
  for (const [app, info] of Object.entries(promotions)) {
    if (!cohorts.has(info.promotedAt)) {
      cohorts.set(info.promotedAt, []);
    }
    cohorts.get(info.promotedAt).push(app);
  }

  // Fetched once and reused: cutoffs are applied client-side, per cohort.
  log('listing delivery-ci runs...');
  const deliveryRuns = listRuns(repo, DELIVERY_WORKFLOW);
  log(`  ${deliveryRuns.length} runs back to ${deliveryRuns.at(-1)?.created_at.slice(0, 10) ?? 'n/a'}`);

  log('resolving the exact commit behind each production image...');
  const prodBuilds = {};
  for (const [promotedAt, apps] of [...cohorts].sort((a, b) => (a[0] < b[0] ? 1 : -1))) {
    const found = findStagingDeploys(repo, deliveryRuns, apps, promotedAt, cache, opts.maxRuns);
    Object.assign(prodBuilds, found);
    const missing = apps.filter((a) => !found[a]);
    log(`  ${promotedAt.slice(0, 10)}: ${Object.keys(found).length}/${apps.length} resolved${missing.length ? ` (unresolved: ${missing.join(', ')})` : ''}`);
    saveCache(cache);
  }

  log('resolving uat...');
  const universe = [...new Set([...workspaceApps(), ...Object.keys(promotions)])];
  const uatBuilds = findStagingDeploys(repo, deliveryRuns, universe, null, cache, opts.maxRuns);
  saveCache(cache);
  log(`  ${Object.keys(uatBuilds).length} of ${universe.length} apps resolved in uat`);

  const scoped = opts.deps ? dependencyPaths(opts.quiet) : null;

  const names = new Set([...Object.keys(promotions), ...Object.keys(uatBuilds)]);
  if (opts.services.length) {
    for (const n of [...names]) {
      if (!opts.services.includes(n)) {
        names.delete(n);
      }
    }
  }

  log('walking git history...');
  const services = [];
  for (const name of [...names].sort()) {
    const ownPaths = [`apps/${name}`];
    const inRepo = existsSync(join(REPO_ROOT, 'apps', name));
    const paths = scoped?.[name] ?? ownPaths;

    const prodBuild = prodBuilds[name];
    const prod = prodBuild && haveCommit(prodBuild.sha)
      ? { ...prodBuild, promotedAt: promotions[name].promotedAt, promoteRun: promotions[name].promoteRun }
      : null;
    const uat = uatBuilds[name] && haveCommit(uatBuilds[name].sha) ? uatBuilds[name] : null;

    const prodToMain = prod ? commitsBetween(prod.sha, refSha, ownPaths) : [];
    const prodToMainScoped = prod ? commitsBetween(prod.sha, refSha, paths) : [];
    const prodToUat = prod && uat ? commitsBetween(prod.sha, uat.sha, ownPaths) : [];
    const uatToMain = uat ? commitsBetween(uat.sha, refSha, ownPaths) : [];

    // Which shared libraries moved, and by how much. The counts alone answer "where did
    // the change come from"; the full text is recoverable with
    // `git log <prodSha>..<ref> -- <path>` when a summary needs the detail.
    const dependencyBreakdown = {};
    if (prod) {
      for (const path of paths) {
        if (path === ownPaths[0]) {
          continue;
        }
        const n = commitsBetween(prod.sha, refSha, [path]).length;
        if (n > 0) {
          dependencyBreakdown[path] = n;
        }
      }
    }

    const service = {
      name,
      inRepo,
      prod,
      uat,
      prodAgeDays: daysBetween(prod?.deployedAt, now),
      ownPaths,
      dependencyPaths: paths,
      dependencyBreakdown,
      checks: prod ? detectChecks({ app: name, prodSha: prod.sha, refSha, ownPaths, commits: prodToMain }) : {},
      counts: {
        prodToMain: prodToMain.length,
        prodToMainScoped: prodToMainScoped.length,
        prodToUat: prodToUat.length,
        uatToMain: uatToMain.length,
      },
      changeTypes: summarizeTypes(prodToMain),
      tickets: [...new Set(prodToMain.flatMap((c) => c.tickets))].sort(),
      prs: [...new Set(prodToMain.map((c) => c.pr).filter(Boolean))],
      commits: { prodToMain, prodToUat, uatToMain },
    };
    service.status = classify(service);
    services.push(service);
  }

  const report = {
    generatedAt: now.toISOString(),
    repo,
    repoUrl,
    ref,
    refSha,
    dependencyScoped: Boolean(scoped),
    coupling: detectCoupling(services),
    services,
  };

  writeFileSync(join(REPO_ROOT, opts.json), JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(join(REPO_ROOT, opts.md), toMarkdown(report), 'utf8');

  const behind = services.filter((s) => s.status === 'behind').length;
  log('');
  if (missingCommits.size > 0) {
    // A deployed SHA absent locally silently drops that environment from the report,
    // so say so rather than letting a stale clone look like a clean result.
    log(`! ${missingCommits.size} deployed commit(s) are not in this clone — run \`git fetch --all\` and re-run.`);
    log(`  ${[...missingCommits].map((s) => s.slice(0, 9)).join(', ')}`);
  }
  log(`wrote ${opts.json} and ${opts.md}`);
  log(`${behind} of ${services.length} services differ from production`);
}

try {
  main();
} finally {
  if (jobCache) {
    saveCache(jobCache);
  }
}
