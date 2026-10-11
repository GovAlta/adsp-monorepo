'use strict';
// ⚠️  LOCAL DEV ONLY — NOT FOR PRODUCTION
// Stubs Keycloak, MongoDB, and ADSP platform. Accepts any Bearer token or no auth.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express   = require('express');
const cors      = require('cors');
const jwt       = require('jsonwebtoken');
const path      = require('path');
const https     = require('https');
const axios     = require('axios');
const rateLimit = require('express-rate-limit');
const { SESSIONS, BUSINESS_MODELS, MESSAGES, HYPOTHESES, PATTERNS, EXPORTS, SPECIALIST_REQUESTS, SPECIALIST_DIRECT_CHATS, AUDIT_EVENTS, USERS, uuidv4, now, paginate } = require('./store');

// ── AI provider config ────────────────────────────────────────────────────────
// Default: GoA MaaS (OpenAI-compatible, internal cert — SSL verification off)
// Fallback: Anthropic direct (requires ANTHROPIC_API_KEY)
const MAAS_API_KEY  = process.env.MAAS_API_KEY;
const MAAS_BASE_URL = process.env.MAAS_BASE_URL  || 'https://maas.int.gov.ab.ca/v1';
const MAAS_MODEL    = process.env.MAAS_MODEL     || 'GOA-Default';
const MAAS_TIMEOUT  = parseInt(process.env.MAAS_TIMEOUT || '240000', 10);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PLANNER_MODEL     = process.env.PLANNER_MODEL || 'claude-sonnet-4-5';

// Axios instance for MaaS.
// TLS verification: off only when MAAS_DISABLE_TLS_VERIFY=true is set explicitly in .env
// (needed for GoA internal CA in some dev environments). Never disable in CI or production.
const maasHttp = axios.create({
  baseURL: MAAS_BASE_URL,
  timeout: MAAS_TIMEOUT,
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.MAAS_DISABLE_TLS_VERIFY !== 'true',
  }),
});

// Anthropic SDK — only instantiated if key is present
let anthropic = null;
if (ANTHROPIC_API_KEY) {
  try {
    const Anthropic = require('@anthropic-ai/sdk').default;
    anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  } catch (_) { /* sdk not installed — fine */ }
}

const AI_MODE = MAAS_API_KEY ? 'maas' : (ANTHROPIC_API_KEY ? 'anthropic' : 'none');
console.log(`[local-dev] AI mode: ${AI_MODE}${AI_MODE === 'maas' ? ` (${MAAS_BASE_URL}, model=${MAAS_MODEL})` : ''}`);

const PLANNER_SYSTEM_PROMPT = `You are the ADSP Project Planner AI — a business planning assistant for the Government of Alberta digital services program (ADSP).

Your role is to help GoA business analysts and program managers structure their digital transformation projects using ADSP platform services.

When a user describes their business problem:
1. Ask targeted clarifying questions to understand: the actors/users involved, the current pain points, the desired outcomes, and any existing systems or constraints
2. Extract and name key concepts: actors, systems, channels, value propositions, activities, constraints
3. After 3–5 exchanges, suggest which ADSP platform services might address their needs (e.g. form-service for online submissions, pdf-service for document generation, notification-service for status updates, comment-service for stakeholder feedback, event-bus for workflow orchestration)
4. Help articulate testable hypotheses about the solution approach

Response style:
- Be concise and direct — government analysts are busy
- Use plain language, avoid jargon
- Use markdown headers and bullet points when presenting structured information
- Number your clarifying questions
- Always connect your suggestions back to what the user described

Context: This is a local development session for testing the ADSP planning interface.`;

// ── Serial specialist queue ───────────────────────────────────────────────────
// All specialist AI calls run one at a time with a 2s gap between them.
// This prevents concurrent MaaS calls that trigger rate limiting.
let _specialistQueueTail = Promise.resolve();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function enqueueSpecialistCall(fn) {
  const next = _specialistQueueTail
    .then(() => fn())
    .then(async (result) => { await sleep(2000); return result; })  // 2s gap after each call
    .catch(async (err) => { await sleep(2000); throw err; });
  _specialistQueueTail = next.catch(() => {});  // keep chain alive on error
  return next;
}

// ── Retry helper — backs off on 429 ──────────────────────────────────────────
async function callAIWithRetry(messages, systemPrompt, maxRetries = 4) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAI(messages, systemPrompt);
    } catch (err) {
      const status = err.response?.status || err.status;
      if (status === 429 && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 5000; // 5s, 10s, 15s — spaced out
        console.log(`[local-dev] 429 — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

// ── Central AI call ───────────────────────────────────────────────────────────
// messages: [{role:'user'|'assistant', content:string}]
// systemPrompt: optional override (defaults to PLANNER_SYSTEM_PROMPT)
// Returns the assistant reply string, or throws with a .statusCode property.
async function callAI(messages, systemPrompt) {
  const sysPrompt = systemPrompt || PLANNER_SYSTEM_PROMPT;
  if (AI_MODE === 'maas') {
    const payload = {
      model: MAAS_MODEL,
      messages: [{ role: 'system', content: sysPrompt }, ...messages],
      stream: false,
    };
    const resp = await maasHttp.post('/chat/completions', payload, {
      headers: { Authorization: `Bearer ${MAAS_API_KEY}`, 'Content-Type': 'application/json' },
    });
    return resp.data.choices[0].message.content;
  }

  if (AI_MODE === 'anthropic') {
    const aiResp = await anthropic.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 1500,
      system: sysPrompt,
      messages,
    });
    return aiResp.content[0]?.type === 'text' ? aiResp.content[0].text : '[No text response]';
  }

  return 'No AI provider configured. Add MAAS_API_KEY (or ANTHROPIC_API_KEY) to apps/local-dev/.env and restart.';
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'local-dev-secret-not-for-prod';

// Restrict CORS to known local origins — never wildcard, even in dev (CodeQL CORS finding)
const DEV_CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',').map(s => s.trim());
app.use(cors({ origin: DEV_CORS_ORIGINS, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Authorization','Content-Type','X-Request-ID'] }));
app.use(express.json());

// Rate limiters — intentionally generous for local dev; present to satisfy CodeQL rule
const apiLimiter = rateLimit({ windowMs: 60_000, max: 3_000, standardHeaders: true, legacyHeaders: false });
const staticLimiter = rateLimit({ windowMs: 60_000, max: 6_000, standardHeaders: true, legacyHeaders: false });

// ── Dev auth middleware (permissive — warns but never rejects) ─────────────────
function devAuth(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
      req.user = { sub: 'anonymous', tenantId: 'goa-digital', roles: [] };
      console.warn('[DEV-AUTH] Invalid/expired token — continuing as anonymous');
    }
  } else {
    req.user = { sub: 'dev-user@gov.ab.ca', tenantId: 'goa-digital', roles: ['planner-user', 'planner-admin'] };
    console.warn('[DEV-AUTH] No token — using default dev persona');
  }
  next();
}

// ── Dev login ─────────────────────────────────────────────────────────────────
const PERSONAS = {
  admin:  { sub: 'admin@gov.ab.ca',  email: 'admin@gov.ab.ca',  name: 'Admin User',         tenantId: 'goa-digital', roles: ['planner-admin', 'planner-user', 'tenant-admin'] },
  user:   { sub: 'user@gov.ab.ca',   email: 'user@gov.ab.ca',   name: 'Planner User',        tenantId: 'goa-digital', roles: ['planner-user'] },
  viewer: { sub: 'viewer@gov.ab.ca', email: 'viewer@gov.ab.ca', name: 'Read-Only Viewer',    tenantId: 'goa-digital', roles: [] },
};

app.get('/dev-login', (req, res) => {
  const persona = PERSONAS[req.query.persona] || PERSONAS.user;
  const token = jwt.sign({ ...persona, iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, persona: req.query.persona || 'user', claims: persona });
});

// ── Health (no auth) ──────────────────────────────────────────────────────────
const healthResp = (_r, res) => res.json({ healthy: true, db: true, llm: false, version: 'local-dev' });
app.get('/health',               healthResp);
app.get('/api/v1/health',        healthResp);
app.get('/health/live',          (_r, res) => res.json({ status: 'alive' }));
app.get('/api/v1/health/live',   (_r, res) => res.json({ status: 'alive' }));
app.get('/health/liveness',      (_r, res) => res.json({ status: 'ok' }));
app.get('/health/ready',         (_r, res) => res.json({ db: true }));
app.get('/api/v1/health/ready',  (_r, res) => res.json({ db: true }));
app.get('/health/readiness',     (_r, res) => res.json({ db: true }));

// ── Hypothesis auto-generation ────────────────────────────────────────────────
const HYPOTHESIS_SYSTEM_PROMPT = `You are the ADSP Solution Hypothesis Generator for the Government of Alberta.

Based on the planning session conversation provided, generate a structured ADSP solution hypothesis.
Respond ONLY with valid JSON matching this exact schema (no markdown, no code blocks):
{
  "title": "short descriptive title (under 80 chars)",
  "summary": "1-3 sentence summary of the recommended ADSP service composition and why it fits",
  "reasoning": "detailed explanation (3-5 sentences) of why each recommended ADSP service addresses the identified needs"
}

Available ADSP services to recommend from: form-service, pdf-service, notification-service, comment-service, event-bus, file-service, task-service, directory-service, tenant-service.
Base your recommendations only on what was discussed in the conversation.`;

async function autoGenerateHypothesis(sessionId, bm) {
  if (!HYPOTHESES[sessionId]) HYPOTHESES[sessionId] = [];
  const pendingH = {
    id: uuidv4(),
    sessionId,
    tenantId: 'goa-digital',
    title: 'Generating hypothesis...',
    summary: 'The Planning Agent is generating a solution hypothesis based on your business model.',
    reasoning: null,
    status: 'draft',
    confidenceScore: bm.confidenceScore,
    version: 1,
    createdAt: now(),
    updatedAt: now(),
  };
  HYPOTHESES[sessionId].push(pendingH);

  setImmediate(async () => {
    try {
      const msgs = (MESSAGES[sessionId] || []).slice(-12);
      const context = msgs.map(m => `${m.role === 'user' ? 'User' : 'Planner'}: ${m.content}`).join('\n\n');
      const userMsg = `Planning session conversation:\n\n${context || '(no messages yet)'}\n\nBusiness model confidence: ${bm.confidenceScore}%\nConcepts identified: ${bm.concepts.map(c => c.name).join(', ') || 'none yet'}\n\nGenerate the solution hypothesis JSON.`;
      const reply = await callAIWithRetry([{ role: 'user', content: userMsg }], HYPOTHESIS_SYSTEM_PROMPT);
      // Extract JSON from reply (handle markdown code blocks if present)
      const jsonStr = reply.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      const parsed = JSON.parse(jsonStr);
      pendingH.title = parsed.title || 'ADSP Solution Hypothesis';
      pendingH.summary = parsed.summary || reply;
      pendingH.reasoning = parsed.reasoning || null;
      pendingH.status = 'proposed';
      pendingH.updatedAt = now();
    } catch (err) {
      console.error('[local-dev] Hypothesis generation error:', err.message);
      pendingH.title = 'ADSP Platform-Enabled Solution';
      pendingH.summary = 'Based on the planning conversation, the ADSP platform services can address your business needs. Review and refine this hypothesis with your planning team.';
      pendingH.reasoning = 'The business model identified key actors, activities, and constraints that align with ADSP platform capabilities. Specific service recommendations should be validated against your technical requirements.';
      pendingH.status = 'proposed';
      pendingH.updatedAt = now();
    }
  });
}

// ── API v1 (all routes use devAuth + rate limiter) ────────────────────────────
const api = express.Router();
api.use(apiLimiter);
api.use(devAuth);

// Sessions
api.post('/sessions', (req, res) => {
  const s = { id: uuidv4(), tenantId: req.user.tenantId, userId: req.user.sub, title: req.body.title || 'Untitled Session', status: 'active', businessModelId: uuidv4(), createdAt: now(), updatedAt: now(), lastResumedAt: null, archivedAt: null };
  SESSIONS.push(s);
  BUSINESS_MODELS[s.businessModelId] = { id: s.businessModelId, sessionId: s.id, tenantId: s.tenantId, version: 1, confidenceScore: 0, concepts: [], relationships: [], createdAt: now(), updatedAt: now() };
  MESSAGES[s.id] = [];
  HYPOTHESES[s.id] = [];
  res.status(201).json(s);
});

api.get('/sessions', (req, res) => {
  let list = SESSIONS.filter(s => s.tenantId === req.user.tenantId);
  if (!req.user.roles.includes('planner-admin') && !req.user.roles.includes('tenant-admin')) list = list.filter(s => s.userId === req.user.sub);
  if (req.query.status) list = list.filter(s => s.status === req.query.status);
  res.json(paginate(list, req.query.page, req.query.pageSize));
});

api.get('/sessions/:sessionId', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(s);
});

api.patch('/sessions/:sessionId', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  if (req.body.title) s.title = req.body.title;
  if (req.body.status) { s.status = req.body.status; if (req.body.status === 'active') s.lastResumedAt = now(); }
  s.updatedAt = now();
  res.json(s);
});

api.delete('/sessions/:sessionId', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  s.status = 'archived'; s.archivedAt = now(); s.updatedAt = now();
  res.status(204).end();
});

// Messages
api.post('/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  if (!SESSIONS.find(x => x.id === sessionId)) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  if (!MESSAGES[sessionId]) MESSAGES[sessionId] = [];

  const userContent = (req.body.content || '').trim();
  if (!userContent) return res.status(400).json({ statusCode: 400, error: 'content is required' });

  const userMsg = { id: uuidv4(), sessionId, tenantId: req.user.tenantId, role: 'user', content: userContent, createdAt: now() };
  MESSAGES[sessionId].push(userMsg);

  let assistantContent;
  try {
    const history = MESSAGES[sessionId].map(m => ({ role: m.role, content: m.content }));
    assistantContent = await callAI(history);
  } catch (err) {
    const status = err.response?.status || err.status || 500;
    console.error(`[local-dev] AI error (${AI_MODE}):`, err.message);
    if (status === 401) {
      assistantContent = `[Auth error] Check your ${AI_MODE === 'maas' ? 'MAAS_API_KEY' : 'ANTHROPIC_API_KEY'} in apps/local-dev/.env and restart.`;
    } else if (status === 429) {
      return res.status(429).set('Retry-After', '60').json({ statusCode: 429, error: 'Rate limit — try again shortly' });
    } else {
      return res.status(503).json({ statusCode: 503, error: 'Planning Agent temporarily unavailable', detail: err.message });
    }
  }

  const assistantMsg = { id: uuidv4(), sessionId, tenantId: req.user.tenantId, role: 'assistant', content: assistantContent, createdAt: now() };
  MESSAGES[sessionId].push(assistantMsg);

  // Update business model confidence after each AI exchange
  const session = SESSIONS.find(x => x.id === sessionId);
  if (session) {
    const bm = BUSINESS_MODELS[session.businessModelId];
    if (bm) {
      const exchangeCount = Math.floor(MESSAGES[sessionId].filter(m => m.role === 'assistant').length);
      bm.confidenceScore = Math.min(85, exchangeCount * 12);
      // Extract simple concepts from AI response text.
      // Types must match ConceptType in api.types.ts: actor | goal | process | system | constraint | other
      const conceptKeywords = [
        { pattern: /citizen|applicant|user|public|client|resident/i,        type: 'actor',              label: 'Citizens / Applicants' },
        { pattern: /staff|officer|admin|reviewer|government|employee/i,      type: 'actor',              label: 'Government Staff' },
        { pattern: /reduce|faster|automate|efficiency|streamline|improve/i,  type: 'goal',               label: 'Process Efficiency Goal' },
        { pattern: /notification|email|alert|status update/i,                type: 'goal',               label: 'Timely Status Notifications' },
        { pattern: /permit|application|form|submit|apply/i,                  type: 'activity',           label: 'Application Submission Activity' },
        { pattern: /review|assess|evaluate|inspect/i,                        type: 'activity',           label: 'Review & Assessment Activity' },
        { pattern: /approval|reject|decision|determine|choose/i,             type: 'decision',           label: 'Approval Decision Point' },
        { pattern: /data|evidence|research|finding|result|report/i,          type: 'evidence',           label: 'Supporting Evidence' },
        { pattern: /policy|regulation|compliance|legal|foip|privacy|rule/i,  type: 'business_rule',      label: 'Regulatory Business Rule' },
        { pattern: /budget|cost|resource|timeline|deadline|constraint/i,     type: 'constraint',         label: 'Budget & Resource Constraints' },
        { pattern: /criteria|standard|metric|threshold|measure|kpi/i,        type: 'evaluation_criteria',label: 'Success Criteria' },
        { pattern: /workflow|process|step|stage|phase|lifecycle/i,           type: 'workflow',           label: 'Business Process Workflow' },
        { pattern: /outcome|objective|result|benefit|impact|value/i,         type: 'outcome',            label: 'Expected Outcome' },
        { pattern: /document|record|file|certificate|letter|report/i,        type: 'document',           label: 'Document / Record' },
        { pattern: /event|trigger|milestone|notification event|webhook/i,    type: 'event',              label: 'Business Event / Trigger' },
        { pattern: /database|system|platform|portal|saas|third.party/i,      type: 'system',             label: 'Internal System' },
        { pattern: /integration|api|service|adsp|external|vendor/i,          type: 'external_system',    label: 'ADSP / External Service' },
        { pattern: /assumption|assuming|presume|expect|suppose/i,            type: 'assumption',         label: 'Key Assumption' },
        { pattern: /unknown|unclear|tbd|to be determined|open question/i,    type: 'unknown',            label: 'Open Question / Unknown' },
      ];
      const allText = MESSAGES[sessionId].map(m => m.content).join(' ');
      const newConcepts = conceptKeywords
        .filter(k => k.pattern.test(allText))
        .filter(k => !bm.concepts.find(c => c.name === k.label))
        .map(k => ({ id: uuidv4(), businessModelId: bm.id, name: k.label, description: undefined, conceptType: k.type, version: 1, createdAt: now(), updatedAt: now() }));
      bm.concepts = [...bm.concepts, ...newConcepts];
      bm.version++;
      bm.updatedAt = now();

      // Auto-generate hypothesis when confidence crosses 70 threshold
      if (bm.confidenceScore >= 70) {
        const hypotheses = HYPOTHESES[sessionId] || [];
        const hasActive = hypotheses.some(h => h.status !== 'rejected' && h.status !== 'superseded');
        if (!hasActive) {
          autoGenerateHypothesis(sessionId, bm);
        }
      }
    }
  }

  res.status(201).json(assistantMsg);
});

api.get('/sessions/:sessionId/messages', (req, res) => {
  const msgs = MESSAGES[req.params.sessionId] || [];
  res.json(paginate(msgs, req.query.page, req.query.pageSize));
});

// Business Model
api.get('/sessions/:sessionId/model', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  const bm = BUSINESS_MODELS[s.businessModelId];
  if (!bm) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(bm);
});

api.patch('/sessions/:sessionId/model', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  const bm = BUSINESS_MODELS[s.businessModelId];
  if (!bm) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  if (req.body.updates) {
    req.body.updates.forEach(u => {
      const c = bm.concepts.find(x => x.id === u.conceptId);
      if (c) c.conceptType = u.conceptType;
    });
  }
  bm.version++; bm.updatedAt = now();
  res.json(bm);
});

// Hypotheses
api.get('/sessions/:sessionId/hypotheses', (req, res) => {
  let list = HYPOTHESES[req.params.sessionId] || [];
  if (req.query.status) list = list.filter(h => h.status === req.query.status);
  res.json(paginate(list, req.query.page, req.query.pageSize));
});

api.get('/sessions/:sessionId/hypotheses/:hypothesisId', (req, res) => {
  const h = (HYPOTHESES[req.params.sessionId] || []).find(x => x.id === req.params.hypothesisId);
  if (!h) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(h);
});

api.patch('/sessions/:sessionId/hypotheses/:hypothesisId', (req, res) => {
  const list = HYPOTHESES[req.params.sessionId] || [];
  const h = list.find(x => x.id === req.params.hypothesisId);
  if (!h) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  if (req.body.status) h.status = req.body.status;
  h.updatedAt = now();
  res.json(h);
});

// Explicit hypothesis generation trigger
api.post('/sessions/:sessionId/hypotheses/generate', (req, res) => {
  const { sessionId } = req.params;
  const s = SESSIONS.find(x => x.id === sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  const bm = BUSINESS_MODELS[s.businessModelId];
  if (!bm) return res.status(404).json({ statusCode: 404, error: 'Business model not found' });
  if (bm.confidenceScore < 70) {
    return res.status(422).json({ statusCode: 422, error: 'Business model confidence must be at least 70 to generate a hypothesis' });
  }
  // Check if already generating
  const hypotheses = HYPOTHESES[sessionId] || [];
  const existing = hypotheses.find(h => h.status !== 'rejected' && h.status !== 'superseded');
  if (existing) {
    return res.json(existing);
  }
  // Start generation
  autoGenerateHypothesis(sessionId, bm);
  const pending = (HYPOTHESES[sessionId] || []).find(h => h.status === 'draft');
  res.status(202).json(pending || { id: 'pending', status: 'draft', message: 'Generation started' });
});

// SPECIALIST_PROMPTS and SPECIALIST_DIRECT_PROMPTS are derived from SPECIALIST_TYPES — see below.

api.post('/sessions/:sessionId/specialists', (req, res) => {
  const { sessionId } = req.params;
  if (!SESSIONS.find(x => x.id === sessionId)) return res.status(404).json({ statusCode: 404, error: 'Not Found' });

  const specialistType = req.body.specialistType || req.body.serviceId || 'form-service';
  const r = { id: uuidv4(), sessionId, tenantId: req.user.tenantId, specialistType, status: 'pending', response: null, createdAt: now() };
  if (!SPECIALIST_REQUESTS[sessionId]) SPECIALIST_REQUESTS[sessionId] = [];
  SPECIALIST_REQUESTS[sessionId].push(r);
  res.status(202).json(r);

  // Queue the AI call — serialised so concurrent specialist requests don't pile onto MaaS
  const msgs = (MESSAGES[sessionId] || []).slice(-8);
  const context = msgs.map(m => `${m.role === 'user' ? 'User' : 'Planner'}: ${m.content}`).join('\n');
  const systemPrompt = SPECIALIST_PROMPTS[specialistType] || SPECIALIST_PROMPTS['form-service'];
  const userMsg = `Here is the recent planning session conversation:\n\n${context || '(no messages yet)'}\n\nPlease provide your specialist guidance.`;
  console.log(`[local-dev] Queuing specialist call: ${specialistType} (id=${r.id})`);
  enqueueSpecialistCall(async () => {
    console.log(`[local-dev] Running specialist call: ${specialistType}`);
    const reply = await callAIWithRetry([{ role: 'user', content: userMsg }], systemPrompt);
    r.status = 'complete';
    r.response = reply;
    r.completedAt = now();
    console.log(`[local-dev] Specialist complete: ${specialistType}`);
  }).catch((err) => {
    // Sanitize user-supplied specialistType before logging to prevent format-string injection
    const safeType = String(specialistType).replace(/[^\w-]/g, '').slice(0, 64);
    console.error('[local-dev] Specialist AI error (%s):', safeType, err.message);
    r.status = 'error';
    r.error = err.message;
  });
});

api.get('/sessions/:sessionId/specialists/:requestId', (req, res) => {
  const requests = SPECIALIST_REQUESTS[req.params.sessionId] || [];
  const r = requests.find(x => x.id === req.params.requestId);
  if (!r) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(r);
});

// ── Specialist Catalogue ──────────────────────────────────────────────────────
// Single source of truth for all ADSP specialist types.
// To add a new service: append one entry. The frontend auto-discovers via GET /api/v1/specialists/types.

const SPECIALIST_TYPES = [
  {
    id: 'form-service',
    label: 'Form Service',
    description: 'Form definitions, drafts, submissions, and review dispositions.',
    suggestions: [
      'How do I build a multi-step permit application form?',
      'What validation patterns work best for income verification?',
      'Show me how to handle file attachments in a form submission.',
      'How do I configure conditional fields based on permit type?',
    ],
    plannerPrompt: 'You are the ADSP Form Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA form-service can address the described need. Cover: recommended form structure, data validation approach, submission workflow, and any integration points. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Form Service Specialist for the Government of Alberta. Help developers design and build form-based solutions.

Capabilities: JSON Schema validation, multi-step wizard forms, conditional branching, file attachments, drafts, submission webhooks, paginated submission queries.

\`\`\`typescript
// Define a form
await formService.createFormDefinition({ name: 'permit-app', jsonSchema: { ... }, uiSchema: { ... } });
// Submit
await formService.submitForm(formId, { data: { applicantName: 'Jane Doe', permitType: 'day-use' } });
// List submissions
await formService.listSubmissions(formId, { page: 1, pageSize: 20 });
\`\`\`

Consider: FOIP/PIPA compliance, retention schedules, WCAG 2.1 AA accessibility, and GoA branding. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'pdf-service',
    label: 'PDF Service',
    description: 'Template-driven PDF generation.',
    suggestions: [
      'Show me a GoA-branded permit certificate template.',
      'How do I batch-generate approval letters?',
      'What template engine does pdf-service use?',
      'How do I embed barcodes in generated PDFs?',
    ],
    plannerPrompt: 'You are the ADSP PDF Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA pdf-service can address the described need. Cover: document generation approach, template strategy, data binding, and distribution options. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP PDF Service Specialist for the Government of Alberta. Help developers generate PDF documents from templates.

Capabilities: Handlebars template engine, GoA branding, dynamic data binding, on-demand and batch generation, PDF/A archival format, file-service storage integration.

\`\`\`typescript
// Upload a template
await pdfService.createTemplate({ name: 'permit-cert', content: '<html>{{applicantName}} — {{permitType}}</html>' });
// Generate a PDF
const pdf = await pdfService.generatePdf(templateId, { applicantName: 'Jane Doe', permitType: 'day-use', issueDate: new Date().toISOString() });
// Batch generation
await pdfService.batchGeneratePdf(templateId, [{ applicantName: 'Jane' }, { applicantName: 'John' }]);
\`\`\`

Consider: GoA letter standards, tagged PDF for accessibility, FOIP before including personal data, retention policy for generated documents. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'comment-service',
    label: 'Comment Service',
    description: 'Topics and comments for notes and discussion.',
    suggestions: [
      'How do I set up staff-only vs. applicant-visible comments?',
      'Show me how to trigger notifications on new comments.',
      'Can comment-service support moderated public consultations?',
      'How do I build an audit trail from comment history?',
    ],
    plannerPrompt: 'You are the ADSP Comment Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA comment-service can address the described need. Cover: commenting model, moderation workflow, stakeholder notification, and auditability. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Comment Service Specialist for the Government of Alberta. Help developers design threaded discussions, case notes, and stakeholder communication.

Capabilities: Named topics per resource, threaded replies, role-based visibility (staff-only / public), soft delete with audit trail, event-bus publishing, notification-service integration.

\`\`\`typescript
// Create a topic for a case
await commentService.createTopic({ name: 'permit-456', resourceId: 'permit-456', resourceType: 'permit' });
// Add a staff-only note
await commentService.addComment(topicId, { content: 'Documents received.', authorId: staffId, visibility: 'staff-only' });
// Add applicant-visible reply
await commentService.addComment(topicId, { content: 'Your application is under review.', visibility: 'public' });
// List comments
await commentService.listComments(topicId, { visibility: 'public', page: 1 });
\`\`\`

Consider: who can see which comments, FOIP implications of retention, moderation for public threads. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'notification-service',
    label: 'Notification Service',
    description: 'Templated notifications to subscribers across email, SMS and bot channels.',
    suggestions: [
      'How do I send a status update email when an application is approved?',
      'Show me a Handlebars email template for a permit approval.',
      'How do I manage subscriber opt-ins and CASL compliance?',
      'What are the rate limits and retry policies?',
    ],
    plannerPrompt: 'You are the ADSP Notification Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA notification-service can address the described need. Cover: notification channels (email/SMS), trigger events, template approach, and delivery confirmation. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Notification Service Specialist for the Government of Alberta. Help developers design and deliver notifications.

Capabilities: Email (GoA SMTP), SMS (Twilio), in-app/portal, Handlebars templates, subscriber lists, delivery receipts, bounce handling, event-bus triggers.

\`\`\`typescript
// Create a template
await notificationService.createTemplate({ name: 'permit-approved', subject: 'Permit {{id}} Approved', body: 'Dear {{name}}, your permit has been approved.', channels: ['email'] });
// Send directly
await notificationService.send({ templateName: 'permit-approved', to: { email: 'jane@example.com', name: 'Jane' }, data: { id: 'APP-001', name: 'Jane' } });
// Subscribe a user
await notificationService.subscribe({ subscriberId: userId, type: 'permit-approved', channels: ['email'], address: 'jane@example.com' });
\`\`\`

Consider: CASL consent, opt-out mechanisms, rate limits, FOIP when personalizing content. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'configuration-service',
    label: 'Configuration Service',
    description: 'Tenant-scoped configuration such as workflow definitions and status values.',
    suggestions: [
      'How do I store and retrieve workflow status values with configuration-service?',
      'Can I version configuration entries?',
      'Show me how to read config at runtime in my service.',
      'How do I manage different configs per tenant?',
    ],
    plannerPrompt: 'You are the ADSP Configuration Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA configuration-service can address the described need. Cover: configuration structure, tenant scoping, versioning, and runtime retrieval. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Configuration Service Specialist for the Government of Alberta. Help developers store and manage tenant-scoped configuration.

Capabilities: Tenant-isolated config namespaces, key-value and structured config, versioning, runtime retrieval, webhook notifications on change, role-based write access.

\`\`\`typescript
// Store a config value
await configService.setConfiguration('workflow-statuses', {
  submitted: 'Submitted', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected'
}, { tenantId });
// Read at runtime
const statuses = await configService.getConfiguration('workflow-statuses', { tenantId });
// Subscribe to changes
await configService.onConfigChange('workflow-statuses', (newValue) => reloadWorkflow(newValue));
\`\`\`

Consider: never store secrets in configuration-service (use environment variables), validate config schema on write, cache reads to reduce latency. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'file-service',
    label: 'File Service',
    description: 'Secure file upload, storage, and retrieval with file types and role-based access.',
    suggestions: [
      'How do I restrict uploads to specific file types (PDF, images)?',
      'Show me how to generate a presigned download URL.',
      'How do I set role-based access on uploaded files?',
      'What are the file size limits?',
    ],
    plannerPrompt: 'You are the ADSP File Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA file-service can address the described need. Cover: upload flow, access control, file type restrictions, and retrieval. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP File Service Specialist for the Government of Alberta. Help developers implement secure file upload and management.

Capabilities: Multipart upload, presigned URLs for direct browser upload, role-based access control, file type allowlists, virus scanning, versioning, retention policies.

\`\`\`typescript
// Get an upload URL (presigned — browser uploads directly, no server proxy)
const { uploadUrl, fileId } = await fileService.getUploadUrl({ filename: 'application.pdf', mimeType: 'application/pdf', allowedRoles: ['applicant'] });
// After upload completes, confirm
await fileService.confirmUpload(fileId);
// Generate a download URL (time-limited)
const { downloadUrl } = await fileService.getDownloadUrl(fileId, { expiresIn: 3600 });
\`\`\`

Consider: FOIP classification of files (Protected A/B), retention schedules, virus scanning latency, accessible file names. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'value-service',
    label: 'Value Service',
    description: 'Store and query business values and metrics over time.',
    suggestions: [
      'How do I store a business metric that changes over time?',
      'Can I query value history for a specific record?',
      'Show me how to track case status transitions.',
      'How is value-service different from a regular database?',
    ],
    plannerPrompt: 'You are the ADSP Value Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA value-service can address the described need. Cover: value namespaces, time-series storage, querying, and use cases. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Value Service Specialist for the Government of Alberta. Help developers store and query business values and metrics.

Capabilities: Named value namespaces per tenant, time-series storage (immutable append), point-in-time queries, aggregation, tag-based filtering. Best for metrics, KPIs, case state snapshots, and business data that needs history.

\`\`\`typescript
// Write a value
await valueService.writeValue('permit-applications', {
  metricName: 'processing-time-days',
  value: 3,
  tags: { permitType: 'day-use', region: 'calgary' },
  timestamp: new Date().toISOString(),
});
// Query recent values
const results = await valueService.queryValues('permit-applications', {
  metricName: 'processing-time-days',
  from: '2024-01-01', to: '2024-12-31',
  tags: { permitType: 'day-use' },
});
\`\`\`

Consider: value-service is NOT a general-purpose database — use it for metrics/business values that need historical querying; use MongoDB/PostgreSQL for mutable records. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'event-service',
    label: 'Event Service',
    description: 'Domain events, event log, and audit trail.',
    suggestions: [
      'How do I publish a domain event when an application is submitted?',
      'Can I query the event log for a specific resource?',
      'How does event-service differ from an audit log?',
      'Show me how to subscribe to events from another service.',
    ],
    plannerPrompt: 'You are the ADSP Event Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA event-service can address the described need. Cover: event publishing, subscription, log querying, and integration patterns. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Event Service Specialist for the Government of Alberta. Help developers publish, subscribe to, and query domain events.

Capabilities: Named event namespaces, event publishing, durable event log with query, push subscriptions (webhooks/SSE), at-least-once delivery, tenant isolation.

\`\`\`typescript
// Publish a domain event
await eventService.publish('permit-applications', {
  name: 'permit-submitted',
  tenantId,
  payload: { permitId: 'APP-001', applicantId: 'user-123', permitType: 'day-use' },
  timestamp: new Date().toISOString(),
});
// Query event log
const events = await eventService.queryEvents('permit-applications', { name: 'permit-submitted', from: '2024-01-01' });
// Subscribe (webhook)
await eventService.subscribe('permit-applications', { name: 'permit-submitted', webhookUrl: 'https://myservice/events' });
\`\`\`

Consider: event-service is append-only (immutable log); design events as facts ("permit-submitted"), not commands ("submit-permit"). Use for audit trails, workflow triggers, and system integration. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'task-service',
    label: 'Task Service',
    description: 'Task queues and assignment of work to staff.',
    suggestions: [
      'How do I create a task and assign it to a staff queue?',
      'Can tasks have priorities and due dates?',
      'Show me how to update task status when work is completed.',
      'How do I notify staff when a task is assigned to them?',
    ],
    plannerPrompt: 'You are the ADSP Task Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA task-service can address the described need. Cover: task creation, queue management, assignment, priority, and status tracking. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Task Service Specialist for the Government of Alberta. Help developers implement work assignment and task queue management.

Capabilities: Named task queues per tenant, task creation with priority/due date, individual or queue-based assignment, status lifecycle (pending → in-progress → completed), event-bus publishing on status change, role-based queue access.

\`\`\`typescript
// Create a task in a queue
await taskService.createTask('permit-review-queue', {
  name: 'Review permit APP-001',
  description: 'Day-use camping permit requires ranger review.',
  priority: 'high',
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  data: { permitId: 'APP-001', applicantName: 'Jane Doe' },
});
// Assign to a specific user
await taskService.assignTask(taskId, { userId: rangerUserId });
// Update status
await taskService.updateTaskStatus(taskId, 'completed', { resolution: 'Approved' });
\`\`\`

Consider: integrate with notification-service to alert assignees; use task-service for human-in-the-loop steps rather than fully automated workflows. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'calendar-service',
    label: 'Calendar Service',
    description: 'Calendars and scheduled events.',
    suggestions: [
      'How do I create a calendar and add available time slots?',
      'Can calendar-service manage booking availability?',
      'Show me how to create a recurring scheduled event.',
      'How do I integrate calendar-service with notification-service for reminders?',
    ],
    plannerPrompt: 'You are the ADSP Calendar Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA calendar-service can address the described need. Cover: calendar creation, event scheduling, availability management, and reminder integration. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Calendar Service Specialist for the Government of Alberta. Help developers implement calendars, scheduling, and availability management.

Capabilities: Named calendars per tenant, scheduled events with recurrence, slot availability querying, booking against slots, event publishing to event-bus, notification-service integration for reminders.

\`\`\`typescript
// Create a calendar
await calendarService.createCalendar({ name: 'ranger-inspections', tenantId });
// Add an available slot
await calendarService.addEvent(calendarId, {
  name: 'Inspection Slot',
  start: '2024-06-01T09:00:00Z',
  end: '2024-06-01T10:00:00Z',
  capacity: 1,
  isAvailable: true,
});
// Query available slots
const slots = await calendarService.getAvailableSlots(calendarId, { from: '2024-06-01', to: '2024-06-30' });
// Book a slot
await calendarService.bookSlot(eventId, { bookedBy: userId, metadata: { permitId: 'APP-001' } });
\`\`\`

Consider: calendar-service manages scheduling and availability, not appointment notifications — pair with notification-service for reminders. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'status-service',
    label: 'Status Service',
    description: 'Application status and public notices.',
    suggestions: [
      'How do I publish a public status notice for a service disruption?',
      'Can status-service show maintenance windows?',
      'Show me how to query current status for all services.',
      'How do I integrate status-service into a public-facing portal?',
    ],
    plannerPrompt: 'You are the ADSP Status Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA status-service can address the described need. Cover: status notice creation, severity levels, public visibility, and portal integration. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Status Service Specialist for the Government of Alberta. Help developers publish and query application status notices and public advisories.

Capabilities: Named status applications, notices with severity (info/degraded/outage/maintenance), time-bounded maintenance windows, public or tenant-scoped visibility, embeddable status widget.

\`\`\`typescript
// Create a status application entry
await statusService.createApplication({ name: 'permit-portal', tenantId, description: 'Online Parks Permit Portal' });
// Publish a status notice
await statusService.createNotice(applicationId, {
  title: 'Scheduled Maintenance',
  description: 'The permit portal will be offline 2024-06-01 02:00–04:00 MDT.',
  type: 'maintenance',
  startsAt: '2024-06-01T08:00:00Z',
  endsAt: '2024-06-01T10:00:00Z',
});
// Query current status
const status = await statusService.getApplicationStatus(applicationId);
\`\`\`

Consider: status notices are public-facing — do not include internal system details; use for citizen-facing communications about planned or unplanned outages. Provide specific, actionable answers with code examples.`,
  },
  {
    id: 'feedback-service',
    label: 'Feedback Service',
    description: 'Collect user feedback on applications.',
    suggestions: [
      'How do I add a feedback widget to my GoA application?',
      'Can I collect structured ratings alongside free-text comments?',
      'Show me how to query and export feedback submissions.',
      'How do I configure the feedback form for a specific page or workflow?',
    ],
    plannerPrompt: 'You are the ADSP Feedback Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA feedback-service can address the described need. Cover: feedback widget integration, data collection, rating scales, and submission querying. Keep the response practical and under 300 words.',
    directPrompt: `You are the ADSP Feedback Service Specialist for the Government of Alberta. Help developers collect and query user feedback on GoA applications.

Capabilities: Embeddable feedback widget (React component), configurable rating scales (1–5 stars, thumbs, NPS), free-text comments, page/context tagging, submission queries and export, tenant isolation.

\`\`\`typescript
// Register a feedback site
await feedbackService.createSite({ name: 'permit-portal', tenantId, allowAnonymous: true });
// Embed widget (React)
import { GoAFeedbackWidget } from '@abgov/react-components';
<GoAFeedbackWidget siteId="permit-portal" context={{ page: 'permit-submission', permitType: 'day-use' }} />
// Query submissions (server-side)
const submissions = await feedbackService.listSubmissions('permit-portal', { from: '2024-01-01', page: 1, pageSize: 50 });
// Export to CSV
const csv = await feedbackService.exportSubmissions('permit-portal', { format: 'csv' });
\`\`\`

Consider: feedback is voluntary and anonymous by default — do not tie to identity without explicit user consent; use feedback data for UX improvement, not compliance. Provide specific, actionable answers with code examples.`,
  },
];

// Derived lookup maps — used by the two consultation route handlers below
const SPECIALIST_PROMPTS = Object.fromEntries(SPECIALIST_TYPES.map(s => [s.id, s.plannerPrompt]));
const SPECIALIST_DIRECT_PROMPTS = Object.fromEntries(SPECIALIST_TYPES.map(s => [s.id, s.directPrompt]));

// GET /api/v1/specialists/types — dynamic catalogue of available specialist types
// Adding a new service to SPECIALIST_TYPES above automatically makes it appear here.
api.get('/specialists/types', (_req, res) => {
  res.json(SPECIALIST_TYPES.map(({ id, label, description, suggestions }) => ({ id, label, description, suggestions })));
});

// POST /sessions/:sessionId/specialists/:type/messages — send a direct message to a specialist
// Synchronous: waits for the AI response (interactive mode for local dev)
api.post('/sessions/:sessionId/specialists/:type/messages', async (req, res) => {
  const { sessionId, type } = req.params;
  if (!SESSIONS.find(x => x.id === sessionId)) {
    return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Session not found' });
  }
  const content = (req.body.content || '').trim();
  if (!content) {
    return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'content is required' });
  }
  const safeType = String(type).replace(/[^\w-]/g, '').slice(0, 64);
  const systemPrompt = SPECIALIST_DIRECT_PROMPTS[safeType] || SPECIALIST_DIRECT_PROMPTS['form-service'];
  const chatKey = `${sessionId}:${safeType}`;
  if (!SPECIALIST_DIRECT_CHATS[chatKey]) SPECIALIST_DIRECT_CHATS[chatKey] = [];

  const userMsg = { id: uuidv4(), role: 'user', content, createdAt: new Date().toISOString() };
  SPECIALIST_DIRECT_CHATS[chatKey].push(userMsg);

  // Build conversation history for multi-turn context (last 20 messages)
  const history = SPECIALIST_DIRECT_CHATS[chatKey].slice(-20).map(m => ({ role: m.role, content: m.content }));

  try {
    const reply = await callAIWithRetry(history, systemPrompt);
    const assistantMsg = { id: uuidv4(), role: 'assistant', content: reply, createdAt: new Date().toISOString() };
    SPECIALIST_DIRECT_CHATS[chatKey].push(assistantMsg);
    res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (err) {
    // Remove the user message from history on failure so it can be retried cleanly
    SPECIALIST_DIRECT_CHATS[chatKey].pop();
    console.error('[local-dev] Specialist direct chat error (%s):', safeType, err.message);
    res.status(503).json({ statusCode: 503, error: 'Service Unavailable', message: 'AI provider unavailable. Please try again.' });
  }
});

// GET /sessions/:sessionId/specialists/:type/messages — get direct chat history
api.get('/sessions/:sessionId/specialists/:type/messages', (req, res) => {
  const { sessionId, type } = req.params;
  if (!SESSIONS.find(x => x.id === sessionId)) {
    return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Session not found' });
  }
  const safeType = String(type).replace(/[^\w-]/g, '').slice(0, 64);
  const chatKey = `${sessionId}:${safeType}`;
  res.json(SPECIALIST_DIRECT_CHATS[chatKey] || []);
});

// Patterns
api.get('/patterns', (req, res) => {
  let list = PATTERNS.filter(p => p.status === 'active');
  res.set('X-Integration-Stubbed', 'INT-002').json(paginate(list, req.query.page, req.query.pageSize));
});

api.post('/patterns', (req, res) => {
  const p = { id: uuidv4(), tenantId: req.user.tenantId, name: req.body.name, description: req.body.description, status: req.body.status || 'active', keywords: req.body.keywords || [], serviceAffinity: req.body.serviceAffinity || [], matchThreshold: req.body.matchThreshold ?? 70, matchCount: 0, createdAt: now(), lastModified: now() };
  PATTERNS.push(p);
  res.status(201).set('X-Integration-Stubbed', 'INT-002').json(p);
});

api.get('/patterns/:patternId', (req, res) => {
  const p = PATTERNS.find(x => x.id === req.params.patternId);
  if (!p) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.set('X-Integration-Stubbed', 'INT-002').json(p);
});

api.put('/patterns/:patternId', (req, res) => {
  const p = PATTERNS.find(x => x.id === req.params.patternId);
  if (!p) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  Object.assign(p, { name: req.body.name || p.name, description: req.body.description || p.description, lastModified: now() });
  res.set('X-Integration-Stubbed', 'INT-002').json(p);
});

api.delete('/patterns/:patternId', (req, res) => {
  const idx = PATTERNS.findIndex(x => x.id === req.params.patternId);
  if (idx === -1) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  PATTERNS.splice(idx, 1);
  res.status(204).end();
});

api.put('/patterns/:patternId/deactivate', (req, res) => {
  const p = PATTERNS.find(x => x.id === req.params.patternId);
  if (!p) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  p.status = 'inactive'; p.lastModified = now();
  res.set('X-Integration-Stubbed', 'INT-002').json(p);
});

// Exports
api.post('/sessions/:sessionId/exports', (req, res) => {
  const s = SESSIONS.find(x => x.id === req.params.sessionId);
  if (!s) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  const expId = uuidv4();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const exp = {
    id: expId,
    sessionId: s.id,
    tenantId: req.user.tenantId,
    format: req.body.format || 'json',
    status: 'complete',
    downloadUrl: `${baseUrl}/api/v1/sessions/${s.id}/exports/${expId}/download`,
    payload: {
      exportedAt: now(),
      session: s,
      businessModel: BUSINESS_MODELS[s.businessModelId] || null,
      hypotheses: HYPOTHESES[s.id] || [],
      messages: (MESSAGES[s.id] || []).map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    },
    createdAt: now(),
  };
  if (!EXPORTS[s.id]) EXPORTS[s.id] = [];
  EXPORTS[s.id].push(exp);
  res.status(201).json(exp);
});

api.get('/sessions/:sessionId/exports/:exportId/download', (req, res) => {
  const exp = (EXPORTS[req.params.sessionId] || []).find(x => x.id === req.params.exportId);
  if (!exp) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  const filename = `session-export-${req.params.sessionId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exp.payload, null, 2));
});

api.get('/sessions/:sessionId/exports', (req, res) => {
  res.json(paginate(EXPORTS[req.params.sessionId] || [], req.query.page, req.query.pageSize));
});

api.get('/sessions/:sessionId/exports/:exportId', (req, res) => {
  const exp = (EXPORTS[req.params.sessionId] || []).find(x => x.id === req.params.exportId);
  if (!exp) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(exp);
});

// Audit
api.get('/audit', (req, res) => {
  let list = AUDIT_EVENTS.filter(e => e.tenantId === req.user.tenantId);
  if (req.query.actorId) list = list.filter(e => e.actorId === req.query.actorId);
  if (req.query.resourceType) list = list.filter(e => e.resourceType === req.query.resourceType);
  res.json(paginate(list, req.query.page, req.query.pageSize));
});

api.get('/audit/verify', (_req, res) => res.json({ verified: true, failedAtIndex: null }));

api.get('/audit/:eventId', (req, res) => {
  const e = AUDIT_EVENTS.find(x => x.id === req.params.eventId);
  if (!e) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(e);
});

// Users
api.get('/users/me', (req, res) => {
  res.json({ userId: req.user.sub, tenantId: req.user.tenantId, roles: req.user.roles || [], email: req.user.email, displayName: req.user.name });
});

api.get('/users', (req, res) => {
  res.json(paginate(USERS.filter(u => u.tenantId === req.user.tenantId), req.query.page, req.query.pageSize));
});

api.post('/users', (req, res) => {
  const u = { id: uuidv4(), tenantId: req.user.tenantId, email: req.body.email, displayName: req.body.displayName || req.body.email, roles: req.body.roles || [], status: 'active', createdAt: now() };
  USERS.push(u);
  res.status(201).json(u);
});

api.get('/users/:userId', (req, res) => {
  const u = USERS.find(x => x.id === req.params.userId || x.email === req.params.userId);
  if (!u) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  res.json(u);
});

api.patch('/users/:userId', (req, res) => {
  const u = USERS.find(x => x.id === req.params.userId || x.email === req.params.userId);
  if (!u) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  if (req.body.displayName) u.displayName = req.body.displayName;
  if (req.body.roles) u.roles = req.body.roles;
  res.json(u);
});

api.delete('/users/:userId', (req, res) => {
  const u = USERS.find(x => x.id === req.params.userId || x.email === req.params.userId);
  if (!u) return res.status(404).json({ statusCode: 404, error: 'Not Found' });
  u.status = 'inactive';
  res.status(204).end();
});

app.use('/api/v1', api);

// ── Dev dashboard UI ──────────────────────────────────────────────────────────
app.use('/static', express.static(path.join(__dirname, 'ui')));
app.get('/', staticLimiter, (_req, res) => res.sendFile(path.join(__dirname, 'ui', 'index.html')));

// ── Root info (mirrors planner-service shape) ─────────────────────────────────
app.get('/info', (req, res) => {
  res.json({ name: 'ADSP Planner — Local Dev Server', version: 'local-dev', port: PORT, note: 'All auth stubbed. Keycloak/MongoDB not required.' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────┐');
    console.log('  │  ADSP Project Planner — Local Dev Server                │');
    console.log('  │  ⚠️  NOT FOR PRODUCTION                                 │');
    console.log('  ├─────────────────────────────────────────────────────────┤');
    console.log(`  │  Dashboard:   http://localhost:${PORT}                     │`);
    console.log(`  │  API base:    http://localhost:${PORT}/api/v1              │`);
    console.log(`  │  Health:      http://localhost:${PORT}/health              │`);
    console.log(`  │  Dev login:   http://localhost:${PORT}/dev-login?persona=admin │`);
    console.log('  └─────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  To run the UI: cd apps/planner-ui && npm run dev  →  http://localhost:5173');
    console.log('');
  });
}

module.exports = { app };
