---
name: adsp-mcp-sync
description: Sync the content the adsp-sdk-mcp-server bundles (docs lock, service OpenAPI specs, capability catalog, SDK reference) after a change to docs/, a service's *.swagger.yml or swagger.config.js, project-planner-service's specialists or patterns, or adsp-service-sdk exports or registration. Use before committing such a change, or when nx test adsp-sdk-mcp-server fails on a docs lock, api-specs, capability catalog or SDK reference check.
---

# Sync MCP server content

`libs/adsp-sdk-mcp-server/README.md` (Refresh workflow, Bundled OpenAPI specs) is the source of truth for what is
bundled and why. Read it when a step below surprises you.

1. Run `npx nx run adsp-sdk-mcp-server:sync-content`. Done when it exits 0 and `git status` shows only
   `libs/adsp-sdk-mcp-server/src/docs/docs-lock.json`, `libs/adsp-sdk-mcp-server/api-specs/` and
   `libs/adsp-sdk-mcp-server/assets/capabilities.json` changed, or nothing.
   - If it names an app with a `swagger.config.js` but no entry, add the app to
     `libs/adsp-sdk-mcp-server/scripts/api-services.json`: under `services` with its service URN and display name, or
     under `excluded` with a reason. Ask the user which, for a new service. Rerun.
   - If it names a service the planner uses but `docs/services/services.md` doesn't list, add the service to the index
     with its guide, or ask the user whether the planner entry is wrong. Rerun.
2. If `libs/adsp-service-sdk/src` exports changed, update `libs/adsp-sdk-mcp-server/src/sdk-reference/reference.ts`
   for every added, removed or changed export: name, kind, module, deprecated flag, summary and example.
3. Run `npx nx test adsp-sdk-mcp-server`. Done when it is green; `docsLock.spec.ts`, `apiSpecs.spec.ts`,
   `capabilities.spec.ts` and `reference.spec.ts` name anything still out of sync. `serviceMatching.spec.ts` fails when
   `find_adsp_services` drops below 90% top-2 on the evaluation set; report which queries regressed instead of
   editing the evaluation set to pass.
4. Commit the synced files in the same PR as the change that caused them, with explicit paths.
