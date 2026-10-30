// The harness instructions; harnessToMarkdown fills {name}, {slug}, {file}, {n} and {component list}.
export const HARNESS_TEMPLATE = `# Build {name}: harness instructions

Follow these instructions to build {name} from a plan exported by the ADSP Project Planner. Start with
"The downloaded files", then work through the steps in order. Each step ends with a check; start the
next step only once it passes. If \`docs/{slug}-build-notes.md\` already exists, read it and continue
from the step it records.

## The downloaded files
The user downloads two files from the planner into the same folder, then attaches this file, or both,
to the prompt:
- \`{file}.md\`: the plan, solution version {n};
- \`{file}-harness.md\`: these instructions.

1. Find the plan: the attached file if there is one, otherwise \`{file}.md\` next to this file,
   or \`docs/bundle/planner-{slug}.md\` once it is in the project. If it isn't there, ask the user to
   attach it. If there are copies such as \`{file} (1).md\`, ask which one to use.
2. Check that the plan's front matter says \`solution-version: {n}\`. If it doesn't, ask the user to
   download both files again from the same version.

Done when you have the plan and its version matches.

## Artifacts
| File | What it is | Changed by |
|---|---|---|
| \`docs/bundle/planner-{slug}.md\` | The plan (solution version {n}): what to build and why | Nobody; read only |
| \`docs/planner-{slug}-harness.md\` | These instructions | Nobody |
| \`docs/{slug}-build-notes.md\` | Your working record: the current step, decisions (D-n), differences from the plan, component status, acceptance results | You, recording the user's answers |

## MCP servers
| Server | Connect with | Use it for | Public site if it can't connect (step 2) |
|---|---|---|---|
| adsp-sdk | stdio: \`npx -y @abgov/adsp-sdk-mcp-server\` | ADSP services, SDK, config schemas, roles | https://govalta.github.io/adsp-monorepo/: the Services and Node SDK pages |
| goa-design-system | http: https://design-system-mcp-osp-mcp-prod.apps.aro-01.int.gov.ab.ca/mcp | GoA components, page examples and their code | https://design.alberta.ca/examples/ for screens, https://design.alberta.ca for components, https://design.alberta.ca/get-started/developers/setup/ to install them |
| arch-playbook (optional) | http: https://arch-playbook-mcp-osp-mcp-prod.apps.aro-01.int.gov.ab.ca/mcp | GoA security, privacy, data, API and delivery standards | None |

What each server needs:
- adsp-sdk: Node.js with npx, and access to the npm registry. Only \`list_service_roles\` needs a
  sign-in: \`npx @abgov/adsp-cli login --tenant "<tenant name>"\`.
- goa-design-system and arch-playbook: the GoA network or VPN.

The config goes in \`.mcp.json\` in the project folder; Copilot in VS Code and Claude Code both read it.
\`\`\`json
{
  "mcpServers": {
    "adsp-sdk": { "type": "stdio", "command": "npx", "args": ["-y", "@abgov/adsp-sdk-mcp-server"] },
    "goa-design-system": { "type": "http", "url": "https://design-system-mcp-osp-mcp-prod.apps.aro-01.int.gov.ab.ca/mcp" },
    "arch-playbook": { "type": "http", "url": "https://arch-playbook-mcp-osp-mcp-prod.apps.aro-01.int.gov.ab.ca/mcp" }
  }
}
\`\`\`

## Guidelines
- Build only what the plan states. The plan is read only; record every difference from it in the
  build notes with the user's decision.
- The user makes every decision. Give numbered options with your recommendation, wait for the choice,
  and record it as D-n.
- When the plan is silent, look it up in this order: goa-design-system, then adsp-sdk, then
  arch-playbook (Approved documents only, for security, privacy, data, API and delivery questions).
  Use a server's public site instead if the user chose it in step 2. If none answers it, ask the user.
- Check each ADSP or GoA claim with a lookup before relying on it, and cite the lookup in the build
  notes.
- Build screens from GoA Design System examples. For each screen, propose the closest example for its
  actor's product type (the plan's roles table), get the user's approval, then start from that
  example's code. If the user says they have their own designs, build from those instead.
- Start from published code: GoA example code for screens, and adsp-sdk's \`get_platform_quickstart\`
  and \`search_sdk_reference\` examples for ADSP calls, or the same on their public sites. Write code
  from scratch only where nothing published fits.
- With Keystone, create files with \`/build\`, \`/component\`, \`/route\` and \`/migration\` whenever one
  fits, instead of writing them by hand.
- Use made-up data only. Never put real personal information, credentials or API keys in code, tests,
  fixtures or a prompt.
- List in the build notes every file that handles sign-in, access control, cryptography, input
  validation, database queries, user-supplied file paths or secrets. A person on the team must review
  and sign off on these; tell the user when the list changes.
- Make every change outside this repo as a walkthrough, one step at a time: say what will change, give
  the recommended steps and commands, wait for approval, confirm it worked, then go to the next step.
- Components missing from the plan's list were rejected by the user. If the build needs one, raise it
  with them.

## Checks
Run checks at every checkpoint in step 4, at the end of step 5, and before every push.

- **Keystone present and your harness can run its review subagents** (Claude Code): run \`/ship\`.
  Done means it exits 0. On a block, show the user the board, fix, and run it again.
  Never skip a check or accept a risk without the user's approval.
  Use \`/ship --deploy\` only in step 6.
- **Otherwise:** run the project's own checks: the \`lint\`, \`typecheck\`, \`test\` and \`build\` scripts in
  each package.json, and the commands the CI workflow runs. Tell the user which exist, which ran, and
  the results. If the project has none, ask the user what to run. Don't add tooling without their
  approval.

Tell the user which of the two you used.

## Step 1: Set up the project folder
Keystone's checks only see code inside the folder that holds \`.claude/\`, so Keystone is copied INTO
the project and committed with it, including \`template/\`, which \`/build\` creates the app from.

1. Ask the user where the project lives. For a new folder, create it and run \`git init\`.
2. Copy, don't move, the plan to \`docs/bundle/planner-{slug}.md\` and this file to
   \`docs/planner-{slug}-harness.md\`, and create the build notes. Skip any that are already there.
3. Skip the rest of this step if the folder already has \`.keystone/project.json\`.
4. Clone https://github.com/GovAlta-EMU/keystone somewhere else, outside the project.
   Copy only what \`distribution.include\` in \`.claude/inventory.json\` lists: no \`.git\`, no history.
5. Run \`/setup\` (fullstack, GoA Design System) and \`/build\`. The code goes in \`app/\`.
6. The user makes the first commit.

Rules while you work:
- Don't hand-edit files in \`.claude/\` or \`template/\`. Keystone's own commands may write there.
- Never delete \`template/\`. Keystone's security checks read it after the build.
- Search \`app/\` and \`docs/\`. \`template/app/\` looks like the app but is not it.
- Record the Keystone version you copied (from \`.keystone/project.json\`) in the build notes.

If the clone fails, tell the user why and offer three options:
1. Get access and retry (recommended).
2. Use their own harness.
3. Continue with you alone.

Warn that options 2 and 3 have no enforced gates: nothing blocks on coverage, code review, design
review or security review. With either one, wherever a step names a Keystone command, do the
equivalent yourself:
- requirements and a slice plan in the build notes instead of \`/factory\`;
- the project's own checks (see Checks) instead of \`/ship\`.

Done when \`/build\` passes, or the user has chosen option 2 or 3.

## Step 2: Connect the MCP servers
Make one lookup on each server. If you don't have a server's tools, it has failed. If adsp-sdk or
goa-design-system fails, find the cause yourself before asking the user:
- Check \`.mcp.json\` in the project folder. If it is missing or lacks a server, add it from MCP servers.
- adsp-sdk: run \`node --version\`, \`npx --version\` and \`npm view @abgov/adsp-sdk-mcp-server version\`.
  A missing command means Node.js isn't installed. A certificate error means the GoA network's
  certificates: set \`NODE_OPTIONS=--use-system-ca\`. Never turn off certificate checks. Any other npm
  error means the npm registry can't be reached.
- goa-design-system: make one request to its URL. Any HTTP response means it is reachable; a DNS
  failure or timeout means the user is off the GoA network or VPN; a certificate error is the same
  certificate problem as above.

Show the user what you found and how to fix each cause. Record the current step in the build notes,
then start the servers:
- **Copilot in VS Code:** ask the user to send any message, which starts new servers, then make the
  lookups again. If the tools are still missing, ask the user to start each server from
  **MCP: List Servers** → **Start Server**, restart this chat and send the command below.
- **Claude Code:** it reads \`.mcp.json\` only when a session starts, so ask the user to restart the
  session, approve the project's servers and send the command below.

The command: \`Follow docs/planner-{slug}-harness.md and continue from docs/{slug}-build-notes.md.\`

If it still fails, offer two options:
1. Stop until both connect (recommended).
2. Use the public site of each server that failed (see MCP servers), under these rules:
   - Install the GoA components and styles the setup page lists, and build every screen from the
     examples page and those components.
   - Never write your own UI in place of a GoA component, or your own code in place of an ADSP
     service the plan names. If the public sites don't cover something, ask the user.
   - Mark each claim taken from them "unverified" in the build notes, with its URL.

With option 2, recheck the unverified claims once the servers connect, before step 5.

If arch-playbook fails, tell the user (it also needs the GoA network or VPN), note it in the build
notes, and carry on without it.

Done when adsp-sdk and goa-design-system both answer a lookup, or the user has chosen option 2.

## Step 3: Analyze the plan
Start the build notes with the workflows (section 7), services (section 3) and components (section 5).

If the plan doesn't state the data classification, ask for it first. Don't recommend one: the data
owner sets it, and a guess that's too low lowers the required ASVS level. List the four levels
(Public, Protected A, Protected B, Protected C) without a recommendation. If the user doesn't know it,
record it as open and continue with made-up data. Once it is decided, look up the application
security standard (GOA-STD-SEC-001) on arch-playbook and record the required ASVS level in the build
notes, or mark it "unverified" if arch-playbook is unavailable.

Then collect the plan's open items, in this order:
1. **Unknowns** under the chosen approach;
2. the open questions under **Questions and answers**;
3. each **Open decision** under the components (section 5);
4. **Questions to resolve** in the specialist notes (section 6);
5. **Open questions** in the delivery plan (section 9).

Ask a question once, even when several headings list it, and don't ask again about anything under
**Recorded decisions**. The conversation sections are history: don't take answers from them, but
where they suggest one, offer it as an option for the user to confirm.

Work through the open items a few at a time. For each, give numbered options with your
recommendation, grounded in a lookup (see Guidelines) where one applies. For a blank cell in the roles
table (section 1), ask the user; for a blank product type, propose \`public-form\` or \`workspace\` using
GoA's definitions from goa-design-system's \`productTypes\`, or the workspace and public-form pages on
https://design.alberta.ca/examples/. Also raise every place where a lookup disagrees with the plan, or
where two parts of the plan disagree with each other. An answer can settle or raise other questions;
ask the new ones next. If an answer changes an earlier decision, say which one and ask before replacing
it.

Then read the acceptance criteria (section 10): the checks the finished app must pass. If the plan has
no section 10, or it says to regenerate the blueprint, offer three options:
1. Regenerate the blueprint in the planner and download both files again (recommended).
2. Write the criteria yourself from the plan, following the rules below. Record them in the build
   notes as written by you, not taken from the plan.
3. Continue without the acceptance table. Record this as a decision.

The rules for a criterion:
- It restates one thing the plan already says: a workflow (section 7), a recorded decision, an
  answered question, a scope item, or a rule in section 8 or 9. Never write one where the plan is
  silent.
- Write it as \`AC-n (Actor): Given …, when …, then ….\` and name its source in the plan.
- Group them under one heading per workflow, then a Rules heading.

If a decision conflicts with a criterion, record it as a difference from the plan and ask the user
before building against the decision. If section 10 says the plan states nothing to check, skip the
acceptance table and say why in the build notes.

Ask how the app will be deployed, and record the answer as a decision:
1. Their own pipeline.
2. \`oc\` commands.
3. Keystone deploy-aro (OpenShift).
4. Keystone deploy-nexus (Cloud Run sandbox).
5. Not decided yet.

With 3 or 4, switch the Keystone profile to standard with \`/setup --force\`. With 3, the adapter
handles the OpenShift components in step 5.

Done when every item is answered or deferred by the user. Deferred items stay listed as open in the
build notes.

Optional: if the user already has an ADSP tenant, offer to connect early. That means the service
account walkthrough from step 5 plus one live ADSP call, which catches sign-in problems before
development.

## Step 4: Develop locally
Put each ADSP service behind a port with a local stub and a platform adapter, chosen by
\`ADSP_MODE=local|platform\`. The app then runs and is tested locally with no ADSP access.
Run \`/factory docs/bundle\`. Each of its \`/ship\` runs is a local checkpoint (see Checks), not the
finish.
If the plan has acceptance criteria, each requirement (FR) lists the AC ids it covers, if any, and
every AC is covered by at least one FR.
Check this before building, and raise any gap with the user.

At the end of this step, fill in the Acceptance table in the build notes, one row per AC:
| AC | FRs | Test name | Result |
|---|---|---|---|
The test name is the one the runner prints, such as \`intake.spec.ts › restores a saved draft\`. The
result is pass, fail, or a difference the user accepted.
Done when the app runs end to end in local mode, the checks pass, and the Acceptance table is filled
in.

## Step 5: Set up components and connect
Set up each component below in order, exactly as section 5 of the plan describes the one with the
same number: its Where, How and Docs, and the open decisions the user settled in step 3 (see the
build notes). Walk the user through the Where and How steps as you go.
Never fill a gap with an assumption: if the plan doesn't say where or how, or a decision is still
open, look it up (see Guidelines) and ask the user.
- **Approved:** check whether it already exists; if it does, move on.
- **Not reviewed:** before you start, list these by number and ask which are needed. Skip the rest.
- **Dependencies:** if a component depends on one that is not reviewed, ask about that one first.
  If a dependency is missing from the list, the user rejected it; raise it before continuing.
- **ADSP configuration:** the user approved these in the plan. Before each one, say what you will
  create and ask to go ahead, then create it. If you need the user, for example for a missing
  permission or to design a form in the editor, ask for their help with the exact steps.
- **Keycloak and OpenShift:** you do not make these changes. Give the instructions and recommended
  commands one step at a time. The user decides whether to do or skip each step, does it, and
  confirms. Check the result where you can.

Then switch to \`ADSP_MODE=platform\` and run a smoke test that exercises each platform adapter.
Rerun the acceptance tests and refresh the Acceptance table.
Done when every component is set up or marked skipped by the user, the smoke test passes, the checks
pass, and every AC in the Acceptance table passes or has a difference the user accepted.

{component list}

## Step 6: Deploy
Use the deploy decision from step 3.
- **Own pipeline or \`oc\`:** walk the user through it one step at a time (see Guidelines).
- **Keystone adapter:** run \`/ship --deploy\`, which adds the security reviews and container checks,
  then run the adapter. deploy-aro needs the VPN, an \`oc\` login and \`PROJECT\`.
- **Not decided yet:** ask again. The user may defer.

If the user skipped the OpenShift components in step 5, ask where to deploy first.
Done when the app is deployed, or the user has deferred deployment.
`;
