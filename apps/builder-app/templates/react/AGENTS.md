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

## Choosing a Layout Pattern

There are two distinct layout shells. Choose one at the start of every new view — mixing them in the same app is wrong.

### Public-facing (citizen services)

Use when the target audience is Albertans accessing a public service.

Shell: `GoabOneColumnLayout` + `GoabAppHeader` + `GoabAppFooter`

- `Home.tsx` is the only page that uses `GoabHeroBanner`.
- Header navigation uses `<Link>` elements inside `GoabAppHeader`.
- Use sentence casing for headings and card titles.

### Internal / staff-facing (workspace tools)

Use when the audience is government staff operating a case management, admin, or review tool.

Shell: `GoabWorkSideMenu` + `GoabWorkSideMenuItem` — **no** `GoabOneColumnLayout`, **no** `GoabAppHeader`, **no** `GoabAppFooter`, **no** `GoabHeroBanner`.

```tsx
import {
  GoabWorkSideMenu,
  GoabWorkSideMenuItem,
  GoabPageBlock,
} from '@abgov/react-components';
import { useNavigate, useLocation } from 'react-router-dom';

function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <GoabWorkSideMenu
        heading="Service name"
        url="/"
        userName="Staff user"
        primaryContent={
          <>
            <GoabWorkSideMenuItem
              label="Applications"
              url="/applications"
              icon="list"
              current={pathname.startsWith('/applications')}
              onClick={(e) => { e.preventDefault(); navigate('/applications'); }}
            />
            <GoabWorkSideMenuItem
              label="Reviews"
              url="/reviews"
              icon="checkmark-circle"
              current={pathname.startsWith('/reviews')}
              onClick={(e) => { e.preventDefault(); navigate('/reviews'); }}
            />
          </>
        }
      />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <GoabPageBlock width="1200px">
          <div style={{ paddingBlock: '2.5rem' }}>
            {children}
          </div>
        </GoabPageBlock>
      </main>
    </div>
  );
}
```

Layout widths (pass as `width` on `GoabPageBlock`):
- Forms / single-column: `640px`
- General content: `1000px`
- Data-heavy / tables: `1200px`

### Which pattern fits common requests

| User says… | Use |
|------------|-----|
| "application form", "citizen portal", "public service page" | Public (GoabOneColumnLayout) |
| "workspace", "case management", "staff tool", "admin view", "review queue", "internal dashboard" | Internal (GoabWorkSideMenu) |

Prefer GOA components over custom HTML/CSS patterns for UI primitives in both cases.

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

## Service UI Patterns

These patterns mirror the established GOA service architecture used across ADSP projects (codified in the `@nx-adsp` Vue generators). Apply them when the user asks for list pages, detail views, intake forms, or any service data interaction.

**List / workspace views, detail views, and action bars are for internal tools — use the `GoabWorkSideMenu` shell for them, not `GoabOneColumnLayout`. Intake forms and confirmation pages can appear in either context.**

### API hook — the glue layer

Centralise all HTTP in a `src/hooks/useApi.ts` hook. Views call `list`, `get`, `save`, `action` in domain terms; wire details (base path, query param names, response envelope shape) live only in the hook.

```ts
// src/hooks/useApi.ts
const API_BASE = '/api/v1';

function path(resource: string, id?: string | number, action?: string) {
  const base = `${API_BASE}/${resource}`;
  if (id === undefined || id === null) return base;
  return action ? `${base}/${id}/${action}` : `${base}/${id}`;
}

export function useApi() {
  async function apiFetch(url: string, init: RequestInit = {}) {
    // Add Bearer token here when ADSP auth is wired up.
    return fetch(url, init);
  }

  async function request<T>(url: string, init: RequestInit, verb: string): Promise<T> {
    const res = await apiFetch(url, init);
    if (!res.ok) throw new Error(`Failed to ${verb} (${res.status})`);
    if (res.status === 204) return undefined as T;
    const body = await res.text();
    return (body ? JSON.parse(body) : undefined) as T;
  }

  function list<T = Record<string, unknown>>(
    resource: string,
    query: { page?: number; pageSize?: number; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; filters?: Record<string, string> } = {}
  ): Promise<{ rows: T[]; total: number }> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.pageSize !== undefined) params.set('limit', String(query.pageSize));
    if (query.search) params.set('search', query.search);
    if (query.sortBy) { params.set('sortBy', query.sortBy); params.set('sortDir', query.sortDir ?? 'asc'); }
    for (const [k, v] of Object.entries(query.filters ?? {})) { if (v) params.set(k, v); }
    const url = path(resource) + (params.toString() ? `?${params}` : '');
    return request<unknown>(url, {}, 'load').then((data) => {
      if (Array.isArray(data)) return { rows: data as T[], total: data.length };
      const env = (data ?? {}) as Record<string, unknown>;
      const rows = (env.results ?? []) as T[];
      return { rows, total: (env.total as number) ?? rows.length };
    });
  }

  function get<T = Record<string, unknown>>(resource: string, id: string | number) {
    return request<T>(path(resource, id), {}, 'load');
  }

  function save<T = Record<string, unknown>>(resource: string, id: string | number | null, body: unknown) {
    const isNew = id === null || id === undefined;
    return request<T>(isNew ? path(resource) : path(resource, id), {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 'save');
  }

  function action<T = Record<string, unknown>>(resource: string, id: string | number, name: string, body?: unknown) {
    return request<T>(path(resource, id, name), {
      method: 'POST',
      ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    }, name);
  }

  return { list, get, save, action };
}
```

### List / workspace view

Paginated, sortable, searchable list. Guard against out-of-order responses with a sequence counter.

```tsx
const PAGE_SIZE = 10;
const { list } = useApi();

const [rows, setRows] = useState<Record<string, unknown>[]>([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [page, setPage] = useState(1);
const [sortBy, setSortBy] = useState<string>();
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
const [search, setSearch] = useState('');
const loadSeq = useRef(0);

async function load(overrides?: { page?: number; sortBy?: string; sortDir?: 'asc' | 'desc'; search?: string }) {
  const seq = ++loadSeq.current;
  setLoading(true);
  setError(null);
  try {
    const result = await list('my-resource', { page: overrides?.page ?? page, pageSize: PAGE_SIZE, sortBy: overrides?.sortBy ?? sortBy, sortDir: overrides?.sortDir ?? sortDir, search: overrides?.search ?? search });
    if (seq !== loadSeq.current) return; // superseded
    setRows(result.rows);
    setTotal(result.total);
  } catch (e) {
    if (seq !== loadSeq.current) return;
    setError(e instanceof Error ? e.message : 'Failed to load.');
  } finally {
    if (seq === loadSeq.current) setLoading(false);
  }
}

useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
```

Display:
- Loading state: `<goa-skeleton type="text" size="3" />`
- Error state: `<GoabCallout type="emergency" heading="Unable to load"><p>{error}</p></GoabCallout>`
- Paginate with `<goa-block>` + `<goa-pagination>`
- Search with debounce (300 ms), reset `page` to 1 on change

### Detail view

Fetch record on mount; re-fetch when the route `id` param changes (React Router v6 re-uses the component).

```tsx
const { id } = useParams();
const navigate = useNavigate();
const { get } = useApi();

const [record, setRecord] = useState<Record<string, unknown> | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);
  get('my-resource', id!).then((data) => {
    if (!cancelled) { setRecord(data); setLoading(false); }
  }).catch((e) => {
    if (!cancelled) { setError(e instanceof Error ? e.message : 'Failed to load.'); setLoading(false); }
  });
  return () => { cancelled = true; };
}, [id]);
```

Render label/value pairs with a two-column `<dl>`:

```tsx
<dl className="detail-fields">
  <dt>Status</dt>
  <dd>{record?.status ?? '—'}</dd>
</dl>
```

```css
.detail-fields { display: grid; grid-template-columns: auto 1fr; gap: var(--goa-space-xs) var(--goa-space-l); margin: 0; }
.detail-fields dt { font-weight: 600; }
```

### Multi-step intake form

Each step is a separate route: `/{resource}/:id/:step`. The record carries `completedSteps: string[]` which drives the stepper's status.

Step structure:
1. Load record on mount (or start fresh if `id === 'new'`).
2. Validate on "Save and continue" — produce `{ message: string; anchor: string }[]`.
3. Show all errors above the form via `<GoabCallout type="emergency">` with anchor links.
4. `save()` includes `completedSteps: [...new Set([...completedSteps, currentStep])]` in the body.
5. On create, redirect to `/{resource}/{newId}/{nextStep}`.
6. Step navigation: allow clicking completed steps and the review step only.

```tsx
function validate(): { message: string; anchor: string }[] {
  const errors: { message: string; anchor: string }[] = [];
  if (!form.name?.trim()) errors.push({ message: 'Name is required.', anchor: '#field-name' });
  return errors;
}
```

Bind `id="field-{key}"` to each `<goa-form-item>` so error anchors scroll to the right field.

### Review (check-your-answers)

Show every field from every step in `<GoabContainer accent="thin">` sections, each with an Edit button routing to that step. Below all sections:

1. A declaration checkbox: "I confirm the information above is accurate and complete."
2. Disable Submit until declared.
3. On submit: call `action('my-resource', id, 'submit')`, then navigate to confirmation.

Coded fields (stored as codes, displayed as labels) — define option arrays once:

```ts
const STATUS_OPTIONS = [{ value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' }];
function optionLabel(options: { value: string; label: string }[], value: unknown) {
  return options.find((o) => o.value === value)?.label ?? String(value ?? '—');
}
```

### Confirmation

Fetch the record to display its **business reference field** (e.g. `referenceNumber`), not the database `id`. Fall back to the route id only if the reference field is missing.

```tsx
const { id } = useParams();
const { get } = useApi();
const [reference, setReference] = useState(id ?? '');

useEffect(() => {
  get('my-resource', id!).then((data) => {
    const ref = data?.referenceNumber;
    if (ref !== null && ref !== undefined && ref !== '') setReference(String(ref));
  }).catch(() => { /* keep route id fallback */ });
}, [id]);
```

```tsx
<GoabCallout type="success" heading="Application submitted">
  <p>Your reference number is <strong>{reference}</strong></p>
  <p>Keep this for your records.</p>
</GoabCallout>
<goa-spacer vspacing="m" />
<h2>What happens next</h2>
<ol>
  <li>We'll review what you submitted.</li>
  <li>We'll contact you if we need more information.</li>
  <li>We'll let you know the outcome.</li>
</ol>
```

### Accessibility rules

- Every `<goa-form-item>` that is mandatory: add `requirement="required"`.
- Loading regions: add `aria-label="Loading"` to the skeleton container.
- Error summaries: link each error message to its field via `anchor` (href = `#field-{key}`).
- Sentence case for all headings, button labels, and callout headings.
- Use `<goa-spacer vspacing="m|l">` between major sections; avoid raw margin in CSS for spacing that should flex with the design system.

### GOA component quick reference

| Need | Component |
|------|-----------|
| Public page shell | `<GoabOneColumnLayout>` + `<GoabAppHeader>` + `<GoabAppFooter>` |
| Internal page shell | `<GoabWorkSideMenu>` + `<GoabWorkSideMenuItem>` + `<GoabPageBlock>` |
| Data table (internal) | `<GoabTable version="2" width="100%">` + `<GoabTableSortHeader version="2">` |
| Pagination | `<GoabPagination version="2" pageNumber={page} itemCount={total} perPageCount={pageSize}>` |
| Filter chips | `<GoabFilterChip content="…">` |
| Loading placeholder | `<goa-skeleton type="text" size="3" />` |
| Errors / alerts | `<GoabCallout type="emergency|information|success">` |
| Form field wrapper | `<goa-form-item label="…" mb="l" id="field-{key}">` |
| Text input | `<GoabInput>` |
| Multiline | `<GoabTextarea>` |
| Date | `<GoabDatePicker>` |
| Dropdown | `<GoabDropdown>` + `<goa-dropdown-item>` |
| Status colour | `<GoabBadge type="success|warning|emergency|information">` |
| Button group | `<goa-button-group gap="relaxed">` |
| Cards / sections | `<GoabContainer accent="thin">` |
| Grid layout | `<GoabGrid minChildWidth="30ch">` |

## Useful References

- [Alberta Design System](https://design.alberta.ca/)
- [React Router Docs](https://reactrouter.com/)
