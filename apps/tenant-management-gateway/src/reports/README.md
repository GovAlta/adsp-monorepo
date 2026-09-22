# Tenant reports (gateway)

Backend-for-frontend (BFF) between **tenant-management-webapp (TMW)** and **value-service**. TMW never talks to value-service directly, and never has to know raw metric names like `pdf-service:pdf-generated:count`. Its companion is the [reports (webapp) README](../../../tenant-management-webapp/src/app/pages/admin/reports/README.md), which owns the registry, Redux wiring, and section components. Read both before adding anything.

> **🧭 30-second version**
>
> - One route serves every service + section: `GET /reports/{serviceId}/{sectionId}`.
> - No handler for that combo? → **404**. No new routes, ever — new work always means a new catalog entry.
> - 🥇 **Golden rule:** wire up the gateway handler *first*, the TMW loader *second*. Do it backwards and the page shows broken/empty instead of a placeholder.
> - This doc is for humans **and** AI agents extending reporting — follow it instead of inventing something new.

**Jump straight to:** [Add a section to an existing service](#add-a-section-to-an-existing-service-eg-pdf-trends) · [Add a brand-new service](#add-a-new-service-eg-form)

---

## 📖 Key terms

Quick definitions — skip if you already know these.

| Term                 | Meaning                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Service**    | Has a report, id like`pdf` (later `form`). Needs a gateway catalog entry *and* a TMW descriptor |
| **Section**    | One part of a report:`summary`, `trends`, `topResources`, `insights`, `apiDrilldown`        |
| **Handler**    | Gateway function that builds one section's`data`                                                    |
| **Catalog**    | Full map of`serviceId → sectionId → handler` (`handlers/index.ts`)                              |
| **Descriptor** | A service's TMW registration: id, label, sections, card metadata                                      |
| **Loader**     | TMW function that fetches one section's data from the gateway                                         |

---

## 🔌 The API contract

One request shape, always:

```
GET /api/tenant/v1/reports/{serviceId}/{sectionId}?from=yyyy-mm-dd&to=yyyy-mm-dd&preset=last30Days
Authorization: Bearer <user JWT>
```

- `serviceId` — TMW registry id (`pdf`). **Not** the ADSP URN.
- `sectionId` — `summary` | `trends` | `topResources` | `insights` | `apiDrilldown`.
- `from` / `to` — the real source of truth for the period.
- `preset` — optional, logging only. TMW already converted it to `from`/`to` before calling.

One success shape, always:

```json
{
  "serviceId": "pdf",
  "sectionId": "summary",
  "period": { "from": "2026-08-18", "to": "2026-09-16" },
  "data": { "pdfGenerated": 11 }
}
```

**Status codes, at a glance:**

| Status              | Means                                     | TMW does                      |
| ------------------- | ----------------------------------------- | ----------------------------- |
| `200` + data      | Here's the payload                        | Renders it                    |
| `200` + all zeros | No activity that period                   | Shows`0`s, not an error     |
| `404`             | Unknown service, or section not built yet | Falls back to the placeholder |
| `400`             | Bad dates / range, or span > 13 months    | Error callout                 |
| `401`             | No token, or value-service rejected it    | Error callout                 |

**Three rules that never change:**

- 🚫 **No per-service routes.** Ever. A new section or a new service is a new catalog entry, not a new URL.
- 🔑 **Auth is pass-through.** The caller's JWT goes straight to value-service. Value-service checks the signature, the tenant, and `value-reader`. The gateway does not use a client secret or the tenant strategy.
- 📅 **Period is always clipped.** `period/` trims `to` back to the last **completed** UTC day (today doesn't count yet) and caps the span at 13 months.

---

## 🗂️ Project layout

```
reports/
  index.ts                 # applyReportsMiddleware — wiring only, keep it thin
  types.ts                 # envelope, catalog, and handler-context types
  README.md                # this file
  router/                  # HTTP only — no value-service calls, no field maps
  client/                  # outbound HTTP to value-service
  period/                  # from/to validation + clipping
  handlers/
    index.ts               # createReportCatalog — the table of contents
    summary.ts             # shared "summary cards" handler factory
    pdf/summary.ts         # PDF's metric → card-id mapping
```

| Path                              | What lives here                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `handlers/index.ts`             | Everything that's implemented. A missing entry is what produces the 404             |
| `handlers/summary.ts`           | Reuse for another service's**summary cards** only — not trends/top-resources |
| `handlers/<service>/summary.ts` | One service's metric → card-id mapping                                             |
| `client/value.ts`               | The only place that calls value-service                                             |
| `router/`                       | `GET /reports/:serviceId/:sectionId` — parse request, look up catalog, delegate  |

No `model/`, no `repository/` here. There's no database — it's a live read-through of value-service.

---

## ✅ Current coverage

| Service | summary | trends | topResources | insights | apiDrilldown |
| ------- | ------- | ------ | ------------ | -------- | ------------ |
| `pdf` | ✅      | 404    | 404          | 404      | 404          |

TMW already draws the other PDF sections as placeholders. They just don't fetch anything until a loader exists.

---

## 🔗 Two registries — both must agree

A section only goes "live" when **both** of these have an entry for it:

1. **Gateway catalog** — `handlers/index.ts`
2. **TMW loader registry** — `serviceReportRegistry.ts`

Missing either one = placeholder (or a 404).

```
TMW page
  descriptor.sections           → which sections render at all
  getSectionLoader(id, section) → no loader? render placeholder, skip the fetch
        │ loader exists
        ▼  GET /api/tenant/v1/reports/{serviceId}/{sectionId}
gateway catalog[serviceId][sectionId]
        │ missing → 404 JSON
        ▼ found
  handler → { serviceId, sectionId, period, data }
```

**TMW files you'll touch** (all under `apps/tenant-management-webapp/src/app/pages/admin/reports/`):

| File                                  | Role                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `registry/services/pdfReport.ts`    | Descriptor:`id`, `sections`, `summaryMetrics[].id`                 |
| `registry/serviceReportRegistry.ts` | `descriptors` array + `registerSectionLoader` / `getSectionLoader` |
| `registry/registerPdfLoaders.ts`    | Registers loaders for**only** the sections PDF actually has        |
| `registry/reportApi.ts`             | `REPORTS_API_BASE` + the generic loader factory                        |
| `serviceReportPage.tsx`             | Calls`registerPdfReportLoaders()`; fetches only sections with a loader |

⚠️ **Must match exactly, same kebab-case string, everywhere:** the URL's `serviceId`, the catalog key, and the descriptor's `id`.

**PDF's card ids** (must match gateway ↔ TMW):
`pdfRequested`, `pdfGenerated`, `pdfFailed`, `unreconciled`, `generationDuration`, `generationDurationMax`, `templatesUsed`

---

## ➕ Extending the reporting API

Two different jobs. Know which one you're doing before you start:

|                        | Add a**section**                                               | Add a**service**                                                   |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Example                | PDF gets`trends`                                                   | Form joins Reports                                                       |
| New route?             | Never                                                                | Never                                                                    |
| Gateway                | 1 new handler file + 1 key in an existing`handlers/index.ts` entry | New`handlers/<service>/` folder + 1 new top-level key                  |
| TMW                    | 1 new loader on an existing descriptor                               | New descriptor + new loader-registration file + push onto`descriptors` |
| Breaks other services? | No                                                                   | No                                                                       |

> 🥇 **Golden rule, again:** gateway handler first, TMW loader second. Loader before handler = the page fetches, gets a 404, and shows *empty* instead of the placeholder it should show.

### Add a section to an existing service (e.g. PDF trends)

**Gateway:**

- [ ] Add `handlers/pdf/trends.ts` (a handler, or a factory + mapping). Only reuse `createSummaryHandler` if it's another summary-cards section.
- [ ] Register it next to PDF's other sections in `handlers/index.ts`:

  ```ts
  pdf: {
    summary: createSummaryHandler(client, pdfSummarySource),
    trends: createPdfTrendsHandler(client),
  },
  ```
- [ ] Extend `handlers/catalog.spec.ts` — new key resolves to a function, still-missing sections stay `undefined`.
- [ ] Add a spec for the handler. No new router path, no new Swagger path needed — both already cover this shape.

**TMW:**

- [ ] Section already in `descriptor.sections`? Leave it. Not there? Add it.
- [ ] Register the loader — **only after the gateway handler exists**:

  ```ts
  registerSectionLoader(pdfReport.id, 'trends', createReportSectionLoader('trends'));
  ```
- [ ] Swap the placeholder body in the section component (e.g. `sections/trendsSection.tsx`) for real `state.data`.
- [ ] Update the loader spec: expect the new loader, keep expecting unregistered sections as `undefined`.

### Add a new service (e.g. Form)

**Gateway:**

- [ ] Create `handlers/form/summary.ts` — copy the shape of `handlers/pdf/summary.ts`.
- [ ] Point `metricLike` + every `metric` / `query` at **form-service** events, not PDF's.
- [ ] Register it in `handlers/index.ts`:

  ```ts
  form: {
    summary: createSummaryHandler(client, formSummarySource),
  },
  ```

  Only list sections Form really supports. An omitted section means 404 — never fake an empty payload to fill the gap.
- [ ] Update `handlers/catalog.spec.ts` (`catalog.form.summary` resolves, `catalog.form.trends` stays `undefined`).
- [ ] Add a summary spec covering the field ids and aggregations. Still no new route.

**TMW:**

- [ ] Add `registry/services/formReport.ts` with:
  - `id: 'form'` — matches the catalog key
  - `featureName` — matches `serviceVariables` in `featureFlag.ts` (PDF uses `'PDF'`)
  - `sections` — only what you're building now, or are happy to placeholder
  - `summaryMetrics[].id` — identical, character for character, to the gateway's field ids
- [ ] Push the new descriptor onto `descriptors` in `serviceReportRegistry.ts`.
- [ ] Add `registerFormReportLoaders()` (mirror `registerPdfLoaders.ts`) and call it from `serviceReportPage.tsx`.
- [ ] Register loaders only for sections that have a catalog handler.
- [ ] Update the registry and loader specs to cover the new service.

No new page needed — the layout already maps all 5 section ids to their components.

---

## 🧮 Summary field types

For `handlers/<service>/summary.ts`, inside a `ServiceSummarySource`:

| `type`         | Gives you                                                                      |
| ---------------- | ------------------------------------------------------------------------------ |
| `sum`          | Sum of`values[].sum`                                                         |
| `avg`          | `sum(sum) / sum(count)`, 1 decimal                                           |
| `max`          | Max of`values[].max`                                                         |
| `unreconciled` | `max(requested - generated, 0)` — list those two fields *before* this one |
| `distinct`     | Distinct`context[contextKey]` values across `query.eventNames`             |

No matching events = `0`, never `null`. Empty clipped period = all zeros, no value-service call at all.

---

## 🚫 Don't

- Add `/reports/pdf/...` or any other one-off path. There's exactly one route.
- Call value-service from TMW directly.
- Put axios calls, period logic, or catalog lookups in `router/`.
- Drop new files in the `reports/` root — a service's mapping goes in `handlers/<service>/`, an upstream call goes in `client/`.
- Register a TMW loader for a section the catalog 404s on.
- Touch `REPORTS_API_BASE` unless the gateway URL itself moves.
- Treat an HTML/proxy 404 as "not offered" — only a gateway **JSON** 404 counts.

---

## 🧪 Verify

```bash
npx nx test tenant-management-gateway --skip-nx-cache
npx nx build tenant-management-gateway --skip-nx-cache
```

Swagger should still show `/api/tenant/v1/reports/{serviceId}/{sectionId}`.

Touched TMW too?

```bash
npx jest --config apps/tenant-management-webapp/jest.config.ts --testPathPattern="pages/admin/reports|store/serviceReports" --no-coverage
```

More on the UI side (registry, Redux wiring, section components) is in the [webapp reports README](../../../tenant-management-webapp/src/app/pages/admin/reports/README.md).
