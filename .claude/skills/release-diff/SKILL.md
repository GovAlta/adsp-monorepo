---
name: release-diff
description: Produce a release-planning report comparing what is deployed to production against main, for every ADSP service. Use at sprint end to decide which services to promote, or whenever someone asks what has changed between production and main, what is safe to promote, how far behind production is, or what a given service would ship if promoted.
---

# Release diff

Read `.github/agents/release-review.agent.md` and follow it.

That file is the single source of truth for this task, and it is the repo's own agent
format — so the same instructions work for whichever agent runner the team uses, not just
Claude Code. Do not duplicate its guidance here; two copies drift, and a stale copy of
promotion advice is worse than none.

Two additions that apply when running as Claude Code:

- Publish the finished report as an Artifact and give the user the link. Load the
  `artifact-design` skill first. Keep per-service detail in collapsed sections so the
  summary stays readable while the drill-down stays available, and keep the same file
  path across sprints so re-runs update one artifact rather than scattering links.
- `tools/release-diff/README.md` documents the collector's method and limits. Read it if
  a result looks wrong before assuming the data is wrong.
