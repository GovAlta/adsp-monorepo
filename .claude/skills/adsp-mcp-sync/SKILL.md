---
name: adsp-mcp-sync
description: Sync the content the adsp-sdk-mcp-server bundles (docs lock, service OpenAPI specs, SDK reference) after a change to docs/, a service's *.swagger.yml or swagger.config.js, or adsp-service-sdk exports. Use before committing such a change, or when nx test adsp-sdk-mcp-server fails on a docs lock, api-specs or SDK reference check.
---

# Sync MCP server content

`libs/adsp-sdk-mcp-server/README.md` (Refresh workflow, Bundled OpenAPI specs) is the source of truth for what is
bundled and why. Read it when a step below surprises you.

1. Run `npx nx run adsp-sdk-mcp-server:sync-content`. Done when it exits 0 and `git status` shows only
   `libs/adsp-sdk-mcp-server/src/docs/docs-lock.json` and `libs/adsp-sdk-mcp-server/api-specs/` changed, or nothing.
   - If it names an app with a `swagger.config.js` but no entry, add the app to
     `libs/adsp-sdk-mcp-server/scripts/api-services.json`: under `services` with its service URN and display name, or
     under `excluded` with a reason. Ask the user which, for a new service. Rerun.
2. If `libs/adsp-service-sdk/src` exports changed, update `libs/adsp-sdk-mcp-server/src/sdk-reference/reference.ts`
   for every added, removed or changed export: name, kind, module, deprecated flag, summary and example.
3. Run `npx nx test adsp-sdk-mcp-server`. Done when it is green; `docsLock.spec.ts`, `apiSpecs.spec.ts` and
   `reference.spec.ts` name anything still out of sync.
4. Commit the synced files in the same PR as the change that caused them, with explicit paths.
