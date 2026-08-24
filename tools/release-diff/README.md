# Release diff collector

Answers "what is actually running in production, and what has landed on `main` since?"
for every ADSP service, so that promotion decisions do not require reading deployment
manifests.

## Two ways to run it

**The collector — no AI, no licence, anyone on the team.**

```bash
node tools/release-diff/collect.mjs
```

Deterministic: same input, same output. Writes `release-diff.md` — read that one — and
`release-diff.json` beside it. On its own it tells you which services differ, what each
would ship, which services are coupled, what happens at deploy time, and where to drill
in. That is the deliverable; nothing below is required to use it.

**The summary — an agent, whichever one you use.**

The judgement layer — "what do these 334 commits amount to, and should it ship?" — is
instructions, not a program. They live in `.github/agents/release-review.agent.md`,
alongside the repo's other agent definitions and in the same format, so any agent runner
can follow them: assign it in GitHub's Agents tab, or run it from an editor.

Invoke it as `@release-review` where the repo's other agents are invoked (`@adsp-plan`,
`@clean-code`). If your client does not index `.github/agents/`, point at the file by
path instead — this works in any agent client, including ones that never resolve `@`
names:

```
Read tools/release-diff/README.md and .github/agents/release-review.agent.md,
then follow those instructions to produce a release review for this repo.
```

You do not need to run the collector first. Running it is the agent's first step.

In Claude Code, type `/release-diff` and it loads the same file.
`.claude/skills/release-diff/SKILL.md` is a two-line pointer, not a second copy — edit
the `.github/agents/` file and every runner picks the change up.

Locally the requirements are already met by a normal dev setup: an authenticated `gh`, a
full clone, and `npm ci`. A cloud agent needs those arranged in its own environment, and
needs an output path that is not gitignored — see **Running in CI**.

The agent runs the collector, reads its output, opens the diffs behind anything it
intends to call significant, and writes a release-planning report with themes,
recommendations, and stated risk.

Either way the work is **read-only**: GitHub run history and your local git. No cluster
access, nothing deployed, nothing configured. GitHub access is yours, not Claude's — the
tool shells out to `gh` using your existing login.

## Usage

Both output files land at the repo root and are gitignored.

| Option | Purpose |
| --- | --- |
| `--json <path>` / `--md <path>` | Output locations |
| `--service <name>` | Limit to one service (repeatable) |
| `--ref <ref>` | Compare against something other than `origin/main` |
| `--no-deps` | Skip nx dependency scoping — much faster, but see the warning below |
| `--max-runs <n>` | Cap the delivery-ci runs scanned per phase (default 150) |
| `--refresh` | Re-query GitHub instead of using cached job lookups |

Requires the GitHub CLI, authenticated (`gh auth status`), and a full clone — the
comparison walks history back several months, so a shallow clone will silently produce
empty commit lists.

The first run makes a few hundred API calls and takes a few minutes. Completed workflow
runs are immutable, so their job lists are cached in `.cache/jobs.json` and later runs
are fast. The cache is checkpointed every 25 fetches, so an interrupted scan resumes
rather than starting over.

## How production's commit is derived

Nothing in the cluster is consulted. Deployment never rebuilds an image, it only moves
tags (`.github/actions/deploy-app`):

```
delivery-ci   build            -> ghcr.io/govalta/<app>:latest and :<github.sha>
              deployDev        -> oc tag <app>:latest -> <app>:dev
              deployStaging    -> oc tag <app>:dev    -> <app>:uat
promote       deployProduction -> oc tag <app>:uat    -> <app>:prod
```

So the commit running in an environment is the head SHA of the workflow run that last
moved that tag:

- **uat** — head SHA of the newest successful `deployStaging (<app>)` job
- **prod** — head SHA of the newest successful `deployStaging (<app>)` job that
  completed *before* that app's newest successful `deployProduction (<app>)` job

Three details this depends on, all easy to get wrong:

1. **Job conclusions, not run conclusions.** Promote runs routinely end in `failure`
   because a post-deploy smoke test failed *after* the deploy job succeeded. Keying off
   the run's conclusion reports recently-deployed services as months stale.
2. **Deploys are per app.** `promote.yml` runs a matrix, and the workflow is dispatched
   with an explicit app list as often as not. Production is not one version; it is one
   version per service.
3. **Date cutoffs are applied client-side.** The workflow-runs API accepts a
   `created=<TIMESTAMP` filter, but given a full ISO timestamp it silently omits runs
   inside the requested range — asking for runs before `2026-08-12T17:23:38Z` returns
   `2026-07-27` as the newest and skips a real run from `2026-08-07`. A dropped run
   resolves the service to an older commit and overstates how far behind production is,
   with no error to notice. The collector pages runs unfiltered and compares dates
   itself.

## Dependency scoping

Counting only commits under `apps/<name>/` is misleading. Workspace libraries are
compiled into the same image, so an app whose own directory barely changed can be
running a form renderer that moved hundreds of commits. The collector resolves each
app's transitive workspace dependencies from the nx project graph and reports both
numbers: `own` and `+deps`.

`--no-deps` skips generating the graph. It is faster, but the resulting ranking
understates risk for the frontend apps in particular — treat it as a smoke test of the
GitHub queries rather than a report you would plan a release from.

## Coupled promotions

Services that implement two halves of the same work have to be promoted together —
otherwise the deployed half calls something production does not have. The collector
derives these from the commit record and leads the report with them.

Grouping uses **ticket references only**. Shared pull request numbers are reported as
supporting evidence but deliberately not used to group: one library fix routinely touches
five apps in a single PR, so grouping on PRs collapses most of the estate into one
meaningless blob. A ticket is feature-level, and is the honest signal that two services
are two halves of one change.

Groups are transitive — services linked by a chain of shared tickets form one group — and
each group lists the tickets that justify it, so the reasoning is checkable rather than
asserted.

Smaller couplings are reported separately as **pairs**, because plenty of real coupling
never gets a ticket. Two signals, both keyed on fan-out:

- **stated** — a `feat` or `fix` whose conventional-commit scope names two or more
  services, e.g. `fix(task-service, tenant-management-webapp): task modal priority not
  saving`. The author said it is one change. Commit type is part of the test: a `chore`
  naming two services is housekeeping done in one pass, not a pairing.
- **likely** — one pull request touching two or three services.

Fan-out above three is treated as a shared library change rippling outward rather than a
promotion pairing, and is listed as background only. Pairs are not merged into the
transitive groups: chaining them re-creates the same blob that grouping on PRs would
produce.

**Pairs are reported, not asserted.** A cross-cutting change applied to several services
in one pass is indistinguishable, from commit metadata alone, from a feature split across
them — `feat(form-service,event-service,file-service): add otel trace` names three
services and is not a coupling at all, while
`fix(task-service, tenant-management-webapp): task modal priority not saving` names two
and genuinely is. The report shows the evidence and leaves that call to the reader.
Deciding it automatically would need the change read, which is the summarizer's job.

## Deploy-time checks

Commit subjects hide the facts that decide a promotion. "Add sorting" does not say that
promoting builds a wildcard index over production data; "add otel" does not say the
exporter is unconfigured and the instrumentation is therefore inert. The collector
answers those deterministically, per service, and leads the report with them:

| Check | What it catches |
| --- | --- |
| `mongoIndexes` | `.index(` declarations added in the range, whether any are wildcard, and whether `autoIndex` is on — i.e. whether the pod builds them against production data at startup |
| `newEnvVars` | Variables added to `envalid.cleanEnv` with no default. Cross-referenced against `.openshift/managed/<app>.yml`, and reported as a question rather than a verdict when the manifest uses `envFrom` (the value may come from a cluster secret that is not in git) |
| `containerChanged` | Changes to the app's `Dockerfile` or the shared `.openshift/{app,service}/Dockerfile` — runtime behaviour can shift with no application commit to explain it |
| `reverts` | Reverts in the range, as a churn signal |

These need no AI, which is the point: the automatic report carries the operational
warnings, and the summarizer is left with genuinely judgment-shaped questions.

## Output

`release-diff.json` carries the full detail: per service, the prod and uat build
(SHA, build date, promote date, run ids), commit lists for `prod..main`, `prod..uat`
and `uat..main`, `dependencyBreakdown` (commits per shared library since the deployed
build), conventional-commit type counts, and referenced `CS-` tickets and PR numbers.

It is around 250KB, so read from it selectively rather than whole.

Services are classified as:

| Status | Meaning |
| --- | --- |
| `current` | No commits on `main` since the deployed build |
| `behind` | Differs from production |
| `never-promoted` | Present in the repo, never successfully deployed to prod |
| `orphaned` | Deployed in production but no longer present in the repo |

## Running in CI

```yaml
permissions:
  contents: read
  actions: read      # required to read workflow run history
steps:
  - uses: actions/checkout@v5
    with:
      fetch-depth: 0 # required: the comparison walks months of history
  - run: node tools/release-diff/collect.mjs --no-deps
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Drop `--no-deps` for dependency scoping; that needs `npm ci` first so `nx` is available.

## Limitations

- A manual `oc tag` performed outside CI is invisible to this method. Everything here
  assumes promotion went through `promote.yml`.
- Scans are bounded by `--max-runs`, and the run listing itself reaches back 1000 runs
  (currently about a year). A service not deployed within that window resolves to
  `null` rather than guessing; unresolved services are named in the progress output.
  `content-service`, promoted in 2025-07 and since deleted, is the current example.
- A deployed SHA that is missing from the local clone is reported at the end of the run
  rather than silently skipped — `git fetch --all` and re-run when that appears.
- Commit counts measure churn, not risk. Ranking by count is a starting point for the
  conversation, not a promotion decision.
