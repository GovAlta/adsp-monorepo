# Reports (tenant-management-webapp)

This is the UI half of tenant reporting — one page (`/admin/reports/:serviceId`) that shows report sections for whichever service is selected. Its companion is the gateway's [reports README](../../../../../../tenant-management-gateway/src/reports/README.md), which owns the API contract and the `serviceId`/`sectionId` catalog. Read both before adding anything.

> **🧭 30-second version**
> - One page, one route. A new service is a **descriptor**, never a new page.
> - A section only shows real data when **two** things both exist: the service's descriptor lists that section, **and** a loader is registered for it. Missing either → placeholder.
> - Loaders are generic. You almost never write fetch code — you call `createReportSectionLoader(sectionId)` and register the result.
> - 🥇 **Golden rule (same one as the gateway doc):** the gateway handler goes live first, this UI's loader second. Backwards = a real fetch that 404s instead of a placeholder.

**Jump straight to:** [Add a section to an existing service](#add-a-section-to-an-existing-service-eg-pdf-trends) · [Add a brand-new service](#add-a-new-service-eg-form)

---

## 📖 Key terms

| Term | Meaning |
| --- | --- |
| **Descriptor** | A service's registration: id, label, which sections it has, summary card metadata. Lives in `registry/services/<service>.ts` |
| **Section** | One part of a report: `summary`, `trends`, `topResources`, `insights`, `apiDrilldown` — same fixed list the gateway uses |
| **Loader** | A function that fetches one section's data from the gateway. Almost always just `createReportSectionLoader(sectionId)` |
| **Section frame** | `<ReportSection>` — the shared component that turns a status (`idle`/`loading`/`error`/`loaded`) into the right thing on screen |
| **Criteria** | The current `{ serviceId, period }` the page is showing. Lives in Redux, one copy for the whole page |
| **Section state** | Per service+section Redux slice: `{ status, data, error }`. Fully generic — nothing to add per section |

---

## 🗺️ How a report gets on screen

```
route /admin/reports/:serviceId
        │
        ▼
  Reports (reports.tsx) — heading + layout only
        │
        ▼
  ServiceReportPage
    - reads serviceId + period from the URL
    - looks up the descriptor: getAvailableServiceReports(featureFlags)
    - dispatch(setReportCriteria(serviceId, period))
    - for each section in descriptor.sections WITH a registered loader:
        dispatch(loadReportSection(serviceId, sectionId))
        │
        ▼ (redux-saga)
  loadReportSection saga
    - looks up the loader: getSectionLoader(serviceId, sectionId)
    - no loader? bail — section stays idle, renders its placeholder
    - gets a token, calls loader({ descriptor, period, token, serviceUrls })
    - dispatch success/failure
        │
        ▼
  reducer stores { status, data | error } at sections[serviceId][sectionId]
        │
        ▼
  selectSectionDisplayState(serviceId, sectionId)
        │
        ▼
  section component (e.g. SummaryMetricsSection) renders via <ReportSection>
```

Nothing in this chain is service-specific except the descriptor and (sometimes) what a section renders. The routing, Redux state machine, and control widgets are the same for every service.

---

## 🗂️ Folder map

```
pages/admin/reports/
  reports.tsx               # page shell: heading + <ServiceReportPage />
  serviceReportPage.tsx     # orchestrator — reads URL, dispatches, lays out sections
  paths.ts                  # REPORTS_BASE_PATH + reportsPath() helper
  styled-components.ts      # layout/visual primitives shared by sections + controls
  controls/
    serviceSelector.tsx           # dropdown, reads getAvailableServiceReports()
    reportingPeriodSelector.tsx   # preset + custom date range, writes URL search params
  registry/
    types.ts                      # ServiceReportDescriptor, SectionLoader, etc.
    serviceReportRegistry.ts       # descriptors[] + registerSectionLoader/getSectionLoader
    reportApi.ts                   # REPORTS_API_BASE + createReportSectionLoader factory
    services/pdfReport.ts          # PDF's descriptor
    registerPdfLoaders.ts          # registers loaders for the sections PDF actually has
  sections/
    reportSection.tsx              # <ReportSection> — the shared frame, all sections use it
    summaryMetricsSection.tsx      # fully wired example (has a loader)
    trendsSection.tsx              # placeholder-only example (no loader yet)
    topResourcesSection.tsx        # placeholder-only
    insightsSection.tsx            # placeholder-only
    apiDrilldownSection.tsx        # placeholder-only
```

Its Redux slice lives one level up, at `apps/tenant-management-webapp/src/app/store/serviceReports/` (`models.ts`, `actions.ts`, `reducers.ts`, `sagas.ts`, `selectors.ts`) — it's generic across every service and section, so you'll read it far more often than you'll edit it.

---

## 🎛️ What you'll actually touch vs. 🙅 what you won't

| You'll touch this... | ...when you're | You will (almost) never touch |
| --- | --- | --- |
| `registry/services/<service>.ts` | adding a service | `store/serviceReports/*` — generic state machine |
| `registry/register<Service>Loaders.ts` | adding a service or a section | `controls/*` — generic, reads the registry |
| `sections/<section>Section.tsx` | adding a section's real content | `pages/admin/index.tsx` route, `sidebar.tsx` nav — one dynamic route + one static "Reports" link already cover every service |
| `serviceReportPage.tsx` | adding a service (one line, see below) | `registry/types.ts` — only if inventing a **6th** section kind (rare, and it's a gateway change too) |

---

## ✅ Current coverage

| Service | summary | trends | topResources | insights | apiDrilldown |
| --- | --- | --- | --- | --- | --- |
| `pdf` | ✅ wired | placeholder | placeholder | placeholder | placeholder |

This must always match the gateway's catalog — that table is the source of truth for *what the gateway can serve*; this one just reflects whether the UI loader has been wired up yet.

---

## 🧩 The `ReportSection` frame

Every section component hands its state to `<ReportSection>` instead of hand-rolling loading/error/empty logic:

```tsx
<ReportSection title="Trends" testId="reports-section-trends" state={state} placeholder={<PlaceholderBlock />}>
  {/* real content, only rendered when state.status === 'loaded' and data isn't empty */}
</ReportSection>
```

| `state.status` | What renders |
| --- | --- |
| `idle` (no loader yet) | `placeholder` |
| `loading` | `loading`, or a default card skeleton |
| `error` | An error callout, plus `children` if you passed any |
| `loaded`, but `data` is `null`/`[]` | "No data for the selected period" |
| `loaded`, with data | `children` |

That last row is why PDF's summary cards show `0` instead of an empty-state message even on a quiet period: `data` is an **object** (`{ pdfGenerated: 0, ... }`), not `null` or `[]`, so it's never treated as "empty" — the cards render and each one just displays zero. Keep that in mind for a new section: if its data is naturally array-shaped (e.g. a top-N list), an empty array gets the free "no data" message; if it's an object of counters like summary, it won't, so zero-value formatting is on you.

---

## ➕ Extending the UI

Two different jobs — check which one you're doing before you start:

| | Add a **section** | Add a **service** |
| --- | --- | --- |
| Example | PDF gets `trends` | Form joins Reports |
| New route/page? | Never | Never |
| Registry change | One loader line in an existing `register<Service>Loaders.ts` | New descriptor + new `register<Service>Loaders.ts` file |
| Component change | Give one existing placeholder section real content | None — new service reuses all 5 section components |
| Redux/store change | None — the state machine is generic | None |

> 🥇 **Golden rule, again:** don't register a loader for a section the gateway catalog doesn't have yet. It'll fetch, get a 404, and the section will render broken/empty instead of its intended placeholder.

### Add a section to an existing service (e.g. PDF trends)

- [ ] Confirm the gateway already has a handler for it (see the [gateway README](../../../../../../tenant-management-gateway/src/reports/README.md)). If not, that's a gateway change first, not a UI one.
- [ ] Register the loader in `registry/registerPdfLoaders.ts` — this is almost always one line:

  ```ts
  registerSectionLoader(pdfReport.id, 'trends', createReportSectionLoader('trends'));
  ```

- [ ] Give the section real content. In `sections/trendsSection.tsx`, keep the `<ReportSection>` wrapper but add `children` built from `state.data` — copy the pattern in `summaryMetricsSection.tsx` (a "loaded" view, plus a matching `loading` skeleton; `placeholder` stays as-is for `idle`).
- [ ] Update `registerPdfLoaders.spec.ts` to expect the new loader (mirror the existing PDF-summary assertions).
- [ ] Update the section's own spec to cover its new loaded/loading/error states, alongside the existing idle-placeholder test.

Nothing else changes. No new Redux action, reducer case, or selector — `sections['pdf']['trends']` is tracked the moment you dispatch for it, same as every other pair.

### Add a new service (e.g. Form)

- [ ] Check `featureName` first: it must match an entry in `apps/tenant-management-webapp/src/featureFlag.ts` (`completeServiceVariables`). Get this wrong and `getAvailableServiceReports` silently filters your service out forever — it won't even error, it'll just never appear in the selector.
- [ ] Create `registry/services/formReport.ts`:

  ```ts
  export const formReport: ServiceReportDescriptor = {
    id: 'form',
    label: 'Form',
    serviceUrn: 'urn:ads:platform:form-service',
    featureName: 'Form',
    sections: ['summary'], // only sections you're actually implementing (or happy to placeholder)
    summaryMetrics: [
      { id: 'formsSubmitted', label: 'Forms submitted', format: 'count' },
      // ids must match the gateway's handlers/form/summary.ts field ids, exactly
    ],
  };
  ```

- [ ] Push it onto `descriptors` in `serviceReportRegistry.ts`.
- [ ] Create `registry/registerFormLoaders.ts` (mirror `registerPdfLoaders.ts`). Same rule as above: only register loaders for sections the gateway catalog actually has —

  ```ts
  export const registerFormReportLoaders = (): void => {
    registerSectionLoader(formReport.id, 'summary', createReportSectionLoader('summary'));
  };
  ```

- [ ] ⚠️ **Call it.** Add `registerFormReportLoaders();` in `serviceReportPage.tsx`, next to the existing `registerPdfReportLoaders();`. Forgetting this line is the #1 way a "finished" service quietly does nothing — the descriptor shows up, the page renders, and every section just sits on its placeholder.
- [ ] Update `serviceReportRegistry.spec.ts` (descriptor is returned by id, appears when feature-flagged on) and add a `registerFormLoaders.spec.ts` mirroring `registerPdfLoaders.spec.ts`.

Nothing to change in `store/serviceReports/`, `controls/`, `sidebar.tsx`, or the routes in `pages/admin/index.tsx` — all of them already work off the registry for every service.

---

## 🕰️ Criteria & period, in brief

- The URL is the source of truth: `?preset=last30Days` or `?preset=custom&from=...&to=...`.
- `ServiceReportPage` turns that into a `ReportingPeriod` and dispatches `setReportCriteria`.
- `ReportingPeriodSelector` writes those same search params — it doesn't talk to Redux directly.
- Preset → concrete dates live in `store/serviceReports/selectors.ts` (`resolvePeriodRange`, `getPeriodValidationError`). A custom span has no maximum. `getPeriodValidationError` still rejects a start date after the end date. Don't recompute period math in a section or control — call these.

---

## 🚫 Don't

- Add a new page or route per service — the one dynamic route + `ServiceSelector` already cover every service.
- Call the gateway or `axios` directly from a section component. Fetching belongs to a loader, called by the saga — components only read state and render.
- Write a custom loader when `createReportSectionLoader(sectionId)` already does the job. Reach for a custom `SectionLoader` only if a section genuinely needs something other than one GET to `/reports/{serviceId}/{sectionId}`.
- Register a loader for a section the gateway catalog 404s on.
- Add a service without calling its `register<Service>Loaders()` from `serviceReportPage.tsx`.
- Hand-roll loading/error/empty rendering — use the `<ReportSection>` frame so every section behaves the same way.
- Let a descriptor's `featureName` drift from `featureFlag.ts`, or its `summaryMetrics[].id`s drift from the gateway's field ids.

---

## 🧪 Verify

```bash
npx jest --config apps/tenant-management-webapp/jest.config.ts --testPathPattern="pages/admin/reports|store/serviceReports" --no-coverage
```

Touched the gateway too? Check its [README](../../../../../../tenant-management-gateway/src/reports/README.md#verify) for the matching gateway commands.
