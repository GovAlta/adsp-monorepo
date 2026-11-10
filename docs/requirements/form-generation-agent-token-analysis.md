# Form Generation Agent: Token Usage Analysis

## Pipeline Overview

Form generation runs as a 3-agent sequential pipeline:

```
planFormGeneration (once)
  └─► runPass: for each planned step
        └─► generateStepPayload (up to 3 attempts, then sweep pass)
```

Three agents are created at service startup with fixed instructions:
- **`planner`** — 2-line system prompt; runs once per generation run
- **`categoryStepBuilder`** — builds one form page per call; large system prompt
- **`branchStepBuilder`** — builds one conditional branch per call; large system prompt

---

## System Prompt Sizes

The step builder system prompts are built from `loadFormExamples(groups)` which always prepends
`bestPractices` and appends `antiPatterns` regardless of which groups are requested.

### Category step builder

Groups: `controls`, `commonFields`, `content`, `repeating`, `validation`, `computed`

| Component | Chars | ~Tokens |
|---|---|---|
| `bestPractices` (always) | 11,471 | ~2,868 |
| `antiPatterns` (always) | 15,062 | ~3,766 |
| `controls` (12 examples) | 13,952 | ~3,488 |
| `commonFields` (2 examples) | 2,638 | ~660 |
| `content` (5 examples) | 6,961 | ~1,740 |
| `repeating` (2 examples) | 3,521 | ~880 |
| `validation` (3 examples) | 6,026 | ~1,507 |
| `computed` (10 examples) | 29,905 | ~7,476 |
| Instructions + rules | ~570 | ~143 |
| **Total** | **~90,106** | **~22,527** |

### Branch step builder

Groups: `rules`, `validation`, `controls`

| Component | Chars | ~Tokens |
|---|---|---|
| `bestPractices` (always) | 11,471 | ~2,868 |
| `antiPatterns` (always) | 15,062 | ~3,766 |
| `rules` (5 examples) | 17,445 | ~4,361 |
| `validation` (3 examples) | 6,026 | ~1,507 |
| `controls` (12 examples) | 13,952 | ~3,488 |
| Instructions + rules | ~570 | ~143 |
| **Total** | **~64,526** | **~16,132** |

### Planner

System prompt is 2 lines (~180 chars, ~45 tokens). Planner cost is dominated by the user prompt.

---

## Per-Call User Prompt Sizes

| Component | Chars | ~Tokens | Notes |
|---|---|---|---|
| Step header | ~150 | ~38 | Type, label, detail |
| "Already saved" (properties + scopes) | 50–800 | 13–200 | Grows linearly as form fills |
| Source text | up to 24,000 | up to 6,000 | Capped at STEP_SOURCE_CHAR_CAP |
| Contract + deferred branches | ~500 | ~125 | Fixed |
| Previous errors (retries) | ~200 / error | ~50 / error | Only on retries |
| **Total (typical)** | **~25,000** | **~6,250** | |

Planner user prompt: requirement + document section descriptions + full source text (capped at 60,000 chars → ~15,000 tokens).

---

## Token Budget for a Typical Form Run

### 10-step COMPLEX form (5 category + 5 branch steps, 1.5 avg attempts)

| Phase | Calls | Sys tokens/call | User tokens/call | Total |
|---|---|---|---|---|
| Planner | 1 | ~45 | ~15,000 | ~15,045 |
| Category steps | 7.5 | ~22,527 | ~6,250 | ~215,831 |
| Branch steps | 7.5 | ~16,132 | ~6,250 | ~167,109 |
| **Total input** | | | | **~397,985** |

### With prompt caching active (Anthropic / OpenAI prefix caching)

The comment in `agents.ts:46` documents this explicitly: system prompts are intentionally identical
across all calls of the same type so the provider caches them. Steps 2–N pay cache-read rate (~10%).

| Phase | First call | Remaining calls | Total (cached) |
|---|---|---|---|
| Category steps (7.5) | 28,777 full | 6.5 × 8,503 (cached sys + full user) | ~84,042 |
| Branch steps (7.5) | 22,382 full | 6.5 × 8,153 (cached sys + full user) | ~74,878 |
| **Total input (cached)** | | | **~173,965** |

**Caching nearly halves the input token cost for multi-step forms.**

---

## Cost Drivers

1. **`computed` group at 29,905 chars (~7,476 tokens)** — the largest single example group,
   included in every category step even when the form has no computed fields. 10 examples when
   5–7 cover all distinct patterns.

2. **`bestPractices` + `antiPatterns` at 26,533 chars (~6,634 tokens)** — always included in
   every step of both types. Already intentionally designed for caching (same prefix every time).

3. **Source text fallback** — when the planner's `sectionId` doesn't match any document section,
   `stepSourceText()` falls back to ALL sections (up to 24,000 chars) instead of the matching
   section (~2,000–5,000 chars typical). A fallback step pays ~5,000 extra user-prompt tokens
   and is more likely to fail (irrelevant context), causing retries.

4. **Linear growth of "Already saved"** — `describeStepContext()` sends the full property and
   scope lists to every step. For step 8 of 10 (25+ properties), this adds ~200 tokens per call.
   Not the dominant cost but grows with form size.

5. **Retry multiplier** — each validation failure re-calls the step builder (up to 3 attempts),
   re-sending the full system prompt. With caching active, retries are cheap for the system
   prompt but each user prompt is unique (~6,250 tokens per retry).

---

## Optimization Opportunities

### 1. Reduce the `computed` example group (implemented in this branch)

The 10 computed examples contain 3 that are functionally redundant:

| Example | Chars | Why redundant |
|---|---|---|
| `percentage-ratio` | 2,936 | Division + display — covered by `basic-arithmetic` |
| `nested-ternary-logic` | 3,014 | Nested ternary — covered by `conditional-computed` |
| `exponent-sqrt-math` | 3,710 | Specialist math (`sqrt`, `^`, `abs`) — rarely needed in government forms |

Removing these 3 saves **9,660 chars (~2,415 tokens)** per category step call with no loss of
coverage for the patterns that actually appear in government forms.

### 2. Set `AGENT_FORM_GENERATION_STEP_MODEL` to a smaller model (highest-impact knob)

Step building is mechanical transcription — the step builder gets exact wording from the source
document and must map it to known JSON Forms patterns from examples. It does not need a frontier
reasoning model. Setting `AGENT_FORM_GENERATION_STEP_MODEL` to a smaller, faster model can cut
per-step cost by 60–80% with minimal quality loss.

### 3. Add a warning log for `stepSourceText()` fallback (implemented in this branch)

When sectionId doesn't match and all sections are returned, a warning log helps measure how often
this happens and guides improvements to planner sectionId quality. Each fallback step gets ~20K
chars of irrelevant context and is more likely to fail (requiring retries).

### 4. Confirm prompt caching is active

The system prompts are already designed for caching (`agents.ts:46`). Confirm that:
- The provider being used supports prefix/prompt caching
- Cache TTL (5 min for Anthropic) covers the full run duration
- No runtime injection is modifying the system prompt between steps

If caching is broken, fixing it has the same effect as a ~50% input token reduction on
multi-step forms.

### 5. Set per-role reasoning effort

`AGENT_FORM_GENERATION_STEP_REASONING_EFFORT` can reduce reasoning budget for step calls.
Steps are pattern-matching, not planning — `medium` or `low` effort is usually sufficient.
`AGENT_FORM_GENERATION_PLANNER_REASONING_EFFORT` can be left at the default (planning benefits from reasoning).

---

## Implemented Optimizations (this branch)

1. **Removed 3 redundant computed examples** from `loadFormExamples.ts`
2. **Added warning log** to `stepSourceText()` when sectionId fallback occurs

### Before / After (measured)

| Metric | Before | After | Saved |
|---|---|---|---|
| `computed` group | 29,905 chars / ~7,476 tokens | 20,245 chars / ~5,061 tokens | **9,660 chars / ~2,415 tokens** |
| Category step builder system prompt | ~90,106 chars (~22,527 tokens) | ~80,446 chars (~20,112 tokens) | **~2,415 tokens/call** |
| 10-step form, no caching (7.5 category calls) | ~215,831 tokens | ~197,718 tokens | **~18,113 tokens/run** |
| 10-step form, with caching (7.5 category calls) | ~84,042 tokens | ~80,308 tokens | **~3,734 tokens/run** |
