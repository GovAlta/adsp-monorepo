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
const { SESSIONS, BUSINESS_MODELS, MESSAGES, HYPOTHESES, PATTERNS, EXPORTS, SPECIALIST_REQUESTS, AUDIT_EVENTS, USERS, uuidv4, now, paginate } = require('./store');

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
const apiLimiter = rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false });
const staticLimiter = rateLimit({ windowMs: 60_000, max: 600, standardHeaders: true, legacyHeaders: false });

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

// Specialist system prompts — each service gets a focused consultation brief
const SPECIALIST_PROMPTS = {
  'form-service': 'You are the ADSP Form Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA form-service can address the described need. Cover: recommended form structure, data validation approach, submission workflow, and any integration points. Keep the response practical and under 300 words.',
  'pdf-service': 'You are the ADSP PDF Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA pdf-service can address the described need. Cover: document generation approach, template strategy, data binding, and distribution options. Keep the response practical and under 300 words.',
  'comment-service': 'You are the ADSP Comment Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA comment-service can address the described need. Cover: commenting model, moderation workflow, stakeholder notification, and auditability. Keep the response practical and under 300 words.',
  'notification-service': 'You are the ADSP Notification Service Specialist. Based on this planning session context, provide concise technical guidance on how the GoA notification-service can address the described need. Cover: notification channels (email/SMS), trigger events, template approach, and delivery confirmation. Keep the response practical and under 300 words.',
};

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
