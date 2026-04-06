# Builder Agent Starter Template

A React and TypeScript starter template for ADSP Builder, using the Alberta Design System.

This template is primarily used in Builder preview, where users prototype by prompting an AI agent. The agent updates the workspace, and users validate results in the preview.

This folder is also standalone-friendly: you can copy it out of the monorepo and run local development without Builder-specific preview files.

## Builder Preview Workflow

1. Describe a focused change in plain language.
2. Let the Builder agent apply the update.
3. Validate the result in preview.
4. Iterate with another prompt.

Good prompts are specific about page, intent, and constraints.

Example prompt patterns:

- Add a new Program eligibility page and link it from header navigation.
- Create a two-step application flow with review and submit states.
- Rewrite this content in plain language for Alberta residents.
- Keep the layout consistent with GOA components and sentence casing.

## Local Development

This template is fully self-contained. You can copy this folder anywhere and run:

```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:4273 with hot refresh)
npm run dev

# Build for production
npm run build

# Open preview in browser
npm run preview

# Lint and format
npm run lint
npm run format
```

The template uses webpack with the same build configuration as Builder preview, providing high parity between local and Builder preview behavior.

## Builder Preview Integration

Builder preview uses a prebuilt vendor bundle keyed by `previewTemplateId` in `package.json`.

- Template-owned: source code in this folder, including webpack config for local development.
- Builder-owned: preview scaffold and vendor entry definitions outside this folder.

Current Builder-owned vendor entry for this template:

- [apps/builder-app/templates/preview/react/vendors.entry.js](../../templates/preview/react/vendors.entry.js)

To rebuild template vendors for Builder preview from repo root:

```bash
npx nx run builder-app:build-react-template-vendors
```

To build Builder app distributable with bundled template vendors included:

```bash
npx nx build builder-app
```

## Current Project Structure

```text
src/
├── main.tsx
├── App.tsx                  # Routes: /, /apply, /about, /components
├── config/
│   └── adspForm.ts          # ADSP form service and definition configuration
├── components/
│   └── FormComponent.tsx    # Wrapper for ADSP JSON forms renderers
├── lib/
│   └── adspFormApi.ts       # Load definition + submit helpers (mock/live)
├── pages/
│   ├── Home.tsx             # Landing page + hero banner
│   ├── Apply.tsx            # Information + integrated ADSP form submission flow
│   ├── About.tsx            # Template and workflow guidance
│   └── Examples.tsx         # Component and pattern examples
├── assets/
│   └── hero-banner.png
├── styles.css
└── ionicons.d.ts
```

## Current Routes

- `/` -> Home
- `/apply` -> ADSP form-enabled application page
- `/about` -> About
- `/components` -> Examples

## ADSP Form Starter Configuration

This starter includes an ADSP form integration that works in two modes:

- `mock` mode: no backend required, useful for rapid iteration in Builder preview.
- `live` mode: calls ADSP Form service endpoints to load definitions and submit forms.

Update [src/config/adspForm.ts](src/config/adspForm.ts) to configure:

- `serviceName` and `serviceDescription` for your program website content.
- `definitionId` for the ADSP form definition.
- `formServiceBaseUrl` for your tenant API base URL.
- `accessToken` for authenticated live requests.
- `submitOnCreate` to control create-vs-submit behavior.

## Design and Implementation Conventions

- Use `@abgov/react-components` as the primary UI library.
- Keep Home as the only route with `GoabHeroBanner` unless requested otherwise.
- Use sentence casing for headings and card titles.
- Prefer GOA components over custom HTML/CSS patterns where possible.
- Keep changes incremental and avoid unrelated refactors.

## Runtime Constraints in Builder Preview

- Browser runtime only: do not rely on Node.js APIs.
- Prefer browser-safe imports and minimal runtime dependencies.
- Only known templates are supported in preview.
- If preview reliability degrades, reduce dependency and import complexity first.

## Helpful References

- https://design.alberta.ca
- https://design.alberta.ca/components
- https://design.alberta.ca/examples
- https://reactrouter.com/

## For Agents

See AGENTS.md for implementation rules and preview-focused QA checks.
