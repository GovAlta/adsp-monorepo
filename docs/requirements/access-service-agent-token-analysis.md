# Access-Service AI Chat: Token Usage Analysis

## Architecture

The access-service chat uses a supervisor + 4 specialists pattern:

- **Supervisor** handles all user turns and owns all live discovery/client tools
- **Specialists** are invoked for domain-specific delegation; each receives `baseKnowledge.md` + its own instructions and the last 10 messages (`messageFilter: messages.slice(-10)`)

---

## System Prompt Cost (per turn)

Every user message re-sends the supervisor's full system prompt:

| Component | Chars | ~Tokens |
|---|---|---|
| `baseKnowledge.md` | 5,702 | ~1,425 |
| `supervisor/supervisor.md` | 9,899 | ~2,475 |
| **Supervisor total** | **15,601** | **~3,900** |

This is the floor cost before any conversation history, tools, or delegation.

---

## Delegation Cost (when a specialist is invoked)

`baseKnowledge.md` is re-embedded in every specialist's system prompt:

| Specialist | System prompt | ~Tokens |
|---|---|---|
| `clientAgent` | baseKnowledge + clientAgent.md + clients.md = 17,450 chars | ~4,360 |
| `tokenRoleAgent` | baseKnowledge + tokenRoleAgent.md = 19,492 chars | ~4,870 |
| `identityProviderAgent` | baseKnowledge + identityProviderAgent.md = 9,847 chars | ~2,460 |
| `architectAgent` | baseKnowledge + architectAgent.md = 23,847 chars | ~5,960 |

Each delegation also passes `messages.slice(-10)` (~1,000–3,000 tokens for an active session).

A troubleshooting turn invoking 1–2 specialists: **~8,000–15,000 input tokens** in system prompts + history alone.

---

## Tool Output Cost

| Tool | Typical output |
|---|---|
| `listAccessClients` (all) | 5,000–15,000 tokens for realms with 50+ clients |
| `getAccessClient` | 3,000–8,000 tokens for a full client config |
| Discovery tools | 100–300 tokens each |

A turn calling `listAccessClients` + `getAccessClient` + delegating to `clientAgent`: **25,000–40,000 total input tokens**.

---

## Comparison to Form Generation

| Factor | Form generation | Access service chat |
|---|---|---|
| Session length | Long — 10–40 sequential steps | Short — 2–5 turns typical |
| Growing context | Yes — "already saved" grows each step | Bounded by `messageFilter` on delegation |
| Token ceiling | Very high (N steps × retries) | Moderate per session |
| Main cost driver | Step builders × retries × sweep pass | Specialist delegation + tool output |

Access service is significantly cheaper per session than form generation. The concern is per-turn cost being higher than expected due to the floor system prompt size.

---

## Optimization Opportunities

### 1. `architectAgent.md` has redundant content (highest impact)

`architectAgent.md` at 18,145 chars is the largest file and the most expensive delegation path. It contains:

- **Duplicate environments table** (~400 chars): The same three-environment table already exists verbatim in `baseKnowledge.md`. Every architectAgent invocation already loads `baseKnowledge.md`, so the table in `architectAgent.md` is redundant.
- **ASCII art diagram** (~800 chars): The diagram communicates the same topology described in the text paragraph below it. The text description alone is sufficient.
- **Duplicate "Unconfirmed critical information" table** (~600 chars): This table at the bottom lists the same items already marked "Unconfirmed" in the "Operational responsibilities" table higher in the file.

**Estimated saving: ~1,800 chars → ~450 tokens per architectAgent invocation.**

### 2. `listAccessClients` output is unbounded

The supervisor calls `listAccessClients` without a `search` filter, returning all clients in the realm. For realms with 50+ clients this produces thousands of tokens in tool output. When the user has named a specific client, the supervisor should use `search` to narrow the result first.

**Estimated saving: variable — could eliminate 4,000–10,000 tokens per turn for client-specific questions.**

### 3. Supervisor accumulates full conversation history

The `messageFilter: messages.slice(-10)` in `supervisorOptions.ts` limits history passed TO specialists, but the supervisor itself sees the full unbounded conversation. For a 10-turn diagnostic session, this adds 5,000–10,000 tokens of accumulated history to every supervisor call.

This requires changes to how the supervisor is invoked (a Mastra framework-level option), not just the prompt files.

### 4. `baseKnowledge.md` is re-sent with every specialist

~1,425 tokens re-sent on every delegation. Since it's byte-identical across all 4 specialists, it's a natural prompt-caching candidate if the provider's prompt cache is active. No code change needed — the shared prefix already hits cache on the second delegation within the same turn.

### 5. `tokenRoleAgent.md` at 13,790 chars (~3,448 tokens)

The content is dense and high-value. The main optimization opportunity is confirming that every section is frequently invoked. The `updateToken` code example section (~1,500 chars) is the largest single block.

---

## Implemented Optimizations (this branch)

1. **Removed duplicate environments table from `architectAgent.md`** — already in `baseKnowledge.md`
2. **Removed ASCII art diagram from `architectAgent.md`** — text description is sufficient
3. **Removed duplicate "Unconfirmed critical information" table from `architectAgent.md`** — covered by operational responsibilities table
4. **Added search-first guideline to `supervisor.md`** — use `search` parameter when user names a specific client

### Before / After (measured)

| File | Before | After | Saved |
|---|---|---|---|
| `architectAgent.md` | 18,145 chars | 13,742 chars | **4,403 chars / ~1,100 tokens** |
| `supervisor.md` | 9,899 chars | 10,120 chars | +221 chars (additive) |
| **architectAgent system prompt** | **23,847 chars** | **19,444 chars** | **~1,100 tokens per invocation** |

The architectAgent was the most expensive delegation path at ~5,960 tokens per invocation; it is now ~4,860 tokens — an 18% reduction with no loss of content.
