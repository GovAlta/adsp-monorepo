# Agent Guidelines for Builder Starter Template

This file provides implementation guidance for the Builder agent when modifying this starter workspace.

## Primary Context

- This starter is used inside Builder for AI-assisted live prototyping.
- End users interact through prompts in Builder; they are not directly editing source files.
- Agent changes should be incremental, preview-friendly, and easy to validate quickly.

## Current Project Structure

```
src/
├── main.tsx                # App entry point
├── App.tsx                 # Routes: /, /apply, /about, /components
├── config/
│   └── adspForm.ts         # ADSP form integration config (mock/live)
├── components/
│   └── FormComponent.tsx   # ADSP JSON forms wrapper
├── lib/
│   └── adspFormApi.ts      # Definition loading and submission helpers
├── pages/
│   ├── Home.tsx            # Landing page with app header + hero banner
│   ├── Apply.tsx           # Service information + integrated ADSP form
│   ├── About.tsx           # Template and workflow guidance
│   └── Examples.tsx        # Component/pattern examples
├── assets/
│   └── hero-banner.png     # Hero background image
├── styles.css              # Shared page and typography styles
└── ionicons.d.ts           # Type declarations
```

## Tech Stack

- React 18 + TypeScript
- React Router v6
- Alberta Design System (`@abgov/react-components`)
- ADSP JSON Forms (`@abgov/jsonforms-components`, `@jsonforms/react`)
- Webpack 5 (`webpack-dev-server` for local development)

## Agent Working Rules

1. Read relevant files before editing.
2. Keep changes focused and minimal.
3. Preserve existing GOA design patterns unless the user requests a visual change.
4. Prefer browser-safe runtime imports.
5. Ask before adding dependencies.
6. Keep external dependency changes explicit in `package.json`; preview uses a prebuilt vendor bundle tied to this template.

## Template Conventions to Preserve

- `Home.tsx` is the only page that uses `GoabHeroBanner`.
- All pages use `GoabOneColumnLayout` with `GoabAppHeader` and `GoabAppFooter`.
- Header navigation includes `/apply`, `/components`, and `/about`.
- Use sentence casing for headings and card titles.
- Prefer GOA components over custom HTML/CSS patterns for UI primitives.

## ADSP Form Integration Pattern

- Keep integration settings centralized in `src/config/adspForm.ts`.
- Default to `mode: 'mock'` unless the user explicitly asks for live service calls.
- In live mode, require `formServiceBaseUrl`, `definitionId`, and a valid `accessToken`.
- Keep submission flow simple: load definition, validate, submit, show confirmation reference.

## Routing Pattern

When adding a page:

1. Create `src/pages/NewPage.tsx`.
2. Add a route in `src/App.tsx`.
3. Add navigation links in each page header where appropriate.
4. Verify route reachability in preview.

## Builder Preview vs Local Development

- In Builder, preview runs in a browser sandbox environment and is optimized for fast iteration.
- Local commands are webpack-based (`npm run dev`, `npm run build`) and support standalone template development.
- Builder preview for this template uses a prebuilt template vendor bundle selected by `previewTemplateId` in `package.json`.
- **Routing**: Keep `HashRouter` in `App.tsx` for local/static compatibility. In preview, router APIs are sandbox-adapted automatically.
- **Environment variables**: Avoid Vite-style `import.meta.env.VITE_*`. Use config files or runtime constants.
- Do not assume Builder preview behavior is identical to local webpack HMR.
- If preview breaks, prioritize browser runtime compatibility and minimal dependency overhead.

## Preview Bundle Notes

- Template preview vendors are bundled outside this template folder (Builder-owned preview scaffolding).
- This template remains copyable and runnable without Builder-specific preview files.
- When adding or changing dependencies used at runtime, update `package.json` deliberately and validate both:
  1.  local template run (`npm run dev`)
  2.  Builder preview rendering

## Preview QA Checklist

After UI or routing changes, verify:

1. Header and hero/banner layout do not overlap.
2. Page spacing is consistent and readable on desktop and mobile.
3. Footer appears with proper bottom spacing.
4. Primary CTA on home navigates to `/components`.
5. Routes `/`, `/apply`, `/about`, and `/components` all render without errors.
6. New imports are browser-compatible in preview.

## Important Constraints

- Browser runtime only (no Node.js APIs).
- Keep file and dependency footprint reasonable for preview performance.
- Prefer deterministic, low-risk changes over broad rewrites.
- Only known Builder templates are supported in preview; avoid assumptions that unknown package imports will resolve dynamically.

## Useful References

- [Alberta Design System](https://design.alberta.ca/)
- [React Router Docs](https://reactrouter.com/)
