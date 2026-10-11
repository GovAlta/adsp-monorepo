# ADSP Project Planner — Features & Working Capabilities

> Local dev environment as of 2026-10-11.
> Frontend: http://localhost:5173 · Mock API: http://localhost:3001

---

## Infrastructure

| Component | URL | Notes |
|---|---|---|
| Frontend (Vite + React) | http://localhost:5173 | Hot-reload enabled |
| Mock API Server (Express) | http://localhost:3001 | In-memory state; resets on restart |
| AI Backend | https://maas.int.gov.ab.ca/v1 | GoA MaaS, model `GOA-Default` |

The mock server replaces Keycloak (dev JWT injected automatically) and MongoDB (in-memory store). All API calls are real HTTP — the frontend is unaware it is talking to a mock.

---

## My Planning Sessions

**URL:** http://localhost:5173/sessions

- Lists all sessions for the authenticated user
- Sort by Session Title, Status, or Last Updated (click column headers)
- Filter by status (Active / Paused / Completed / Archived) via filter drawer
- Sessions inactive for 7+ days show an inline "Idle 7+ days" note
- Status chips use solid GoA brand colours with white text:
  - **Active** → GoA green (`#007a4e`)
  - **Paused** → GoA amber (`#ee7100`)
  - **Completed / Archived** → dark grey
- Open / Resume / Export action buttons per row based on session status
- Paginated (20 per page)

---

## Planning Session

**URL:** http://localhost:5173/sessions/:id/planning

### Conversation

- Full AI conversation powered by GoA MaaS (`GOA-Default` model, 240 s timeout)
- Enter to send; Shift+Enter for new line
- AI responses rendered as formatted Markdown (toggle to plain text available)
- Conversation history loads on page open; new messages appended live
- Rate-limit protection: 4 retries with 5 s / 10 s / 15 s / 20 s backoff

### Business Model Panel (right column)

- **Confidence score** in a live colour ramp:
  - 0 % → GoA red (`#c8102e`)
  - 50 % → GoA purple (`#6d2077`)
  - 70 %+ → GoA green (`#007a4e`)
  - Smooth interpolation between anchors
- Confidence and concepts update automatically after every AI exchange
- "Review Business Model" link navigates to the Business Model Review page
- Confidence ≥ 70 % shows a "hypothesis is ready" callout

### Specialist Consultation

- Four ADSP service specialists: **Form Service**, **PDF Service**, **Comment Service**, **Notification Service**
- Requests are serialised (one at a time) with a 2 s gap to prevent rate limiting
- Each specialist call goes to MaaS with a focused brief prompt
- Responses rendered as formatted Markdown
- Client polls for up to 3 minutes (60 × 3 s) to handle MaaS queue wait

### Wizard Step Navigation

Planning → Business Model → Hypothesis → Export

### Save as PDF

"Save as PDF" button calls `window.print()` with a print stylesheet that hides nav chrome and renders the full conversation.

---

## Business Model Review

**URL:** http://localhost:5173/sessions/:id/business-model

Full 15-type concept taxonomy:

| Tab | Concept Types |
|---|---|
| Actors | actor |
| Goals & Activities | goal, activity, outcome, evaluation_criteria |
| Rules & Decisions | business_rule, decision, constraint, assumption, unknown |
| Systems | system, external_system, document, event |
| Evidence | evidence, workflow, process, other |

- AI concept extraction maps conversation keywords to all 15 types during message exchange
- **Confirm Business Model** marks the business model as reviewed
- **Download Business Model** exports the current state as a dated JSON file (`business-model-{sessionId}-{date}.json`)

---

## Hypothesis Review

**URL:** http://localhost:5173/sessions/:id/hypothesis

- **Auto-generation**: when confidence reaches 70 % after an AI exchange the server enqueues a MaaS hypothesis generation call; the hypothesis appears as `proposed` within ~15–30 seconds
- **Generate Hypothesis button**: visible when confidence ≥ 70 % but no hypothesis exists yet; polls every 3 s for up to 90 s with a spinner
- **Confidence gate**: below 70 % a clear message explains the requirement
- Displays: Title, Summary (masked/unmask toggle), Status, Version
- **Planning Agent Reasoning** section (expandable) shows AI service recommendation rationale
- **Accept Hypothesis** → navigates to Session Export
- **Submit Revision** → rejects the current hypothesis, sends a revision message to the Planning Agent, and returns to the conversation
- Already-accepted state shows a "Go to Export" button

---

## Session Export

**URL:** http://localhost:5173/sessions/:id/export

- Export only enabled when the session has an accepted hypothesis
- **Download JSON Export** calls the export endpoint and triggers a browser file-save via `Content-Disposition: attachment`
- Export JSON contains the full session, business model, concepts, hypothesis, and messages

---

## Available Patterns (all users)

**URL:** http://localhost:5173/patterns

- Read-only listing of all 19 ADSP application type patterns
- Accessible from "Browse Patterns" in the Sessions menu (visible to all users)
- Click any pattern name to open the full Pattern Detail view
- No create / edit controls shown

---

## Pattern Detail View

**URL:** http://localhost:5173/admin/patterns/:id/view

Each of the 19 patterns includes:

| Section | Content |
|---|---|
| Purpose | What this pattern is for |
| Common Domain Language | Keywords and terminology (pill tags) |
| Common Features | Typical capabilities in this application type |
| Strong Confidence Signals | Indicators that confirm this pattern |
| Weak / Misleading Signals | Signals that do not confirm on their own |
| ADSP Service Recommendations | Table of services and specific use cases |
| Clarifying Questions | Questions to ask when pattern confidence is low |
| Common Assumptions | Pre-conditions typically true for this pattern |
| Known Unknowns | Variables to resolve per domain |

### The 19 Patterns

1. Case Management
2. Grant Applications
3. Permit / Licence Application
4. Registration / Enrollment
5. Inspection / Compliance
6. Complaint / Concern Intake
7. Consultation / Feedback Collection
8. Benefit / Eligibility Assessment
9. Appointment / Booking Request
10. Document Submission / Package Review
11. Incident / Emergency Response Reporting
12. Information Request / FOIP-Style Request
13. Referral / Routing Workflow
14. Status Tracking Portal
15. Audit / Evidence Trail
16. Public Reporting / Data Collection
17. Template-Driven Document Generation
18. Notification Campaign / Subscription
19. Internal Service Request

---

## Administration

**URL:** http://localhost:5173/admin

### Admin Hub

Four navigation tiles with live session / pattern / audit counts:

| Tile | Route | Access |
|---|---|---|
| Manage Patterns | `/admin/patterns` | planner-admin |
| View History | `/admin/history` | planner-admin |
| View Audit Log | `/admin/audit` | planner-admin |
| Manage Users | `/admin/users` | tenant-admin |

### Session History — `/admin/history`

- All tenant sessions listed (admin view, not scoped to current user)
- Filter by status, date range, user
- Sort by owner, status, created date, last activity
- CSV export (resolves userId to display name; raw userId excluded per privacy rules)

### Pattern Library (admin) — `/admin/patterns`

- Create, edit, and deactivate patterns
- Full rich-content editing for all pattern fields

---

## Seed Data for Testing

| Session | Path | State |
|---|---|---|
| ADSP Planning Session | `/sessions/ba69e202.../planning` | 84 % confidence, 9 concepts, proposed hypothesis |
| Parks Permit Digital Transformation | `/sessions/sess-001/planning` | 72 % confidence, proposed hypothesis |
| FOIP Request Tracking | `/sessions/sess-003/export` | Accepted hypothesis, export ready |
| Test Session | `/sessions/5a3226c7.../planning` | Fresh, 0 % confidence |

---

## Code Quality

- **TypeScript**: strict, zero errors
- **ESLint**: 0 errors, 0 warnings
- **Unit tests**: 281 passing (Vitest + React Testing Library)
- **Branch**: `feature/adsp-planner-enhancements` on `GovAlta-Pronghorn/adsp-monorepo`
