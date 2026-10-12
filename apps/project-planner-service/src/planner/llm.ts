import axios, { AxiosError } from 'axios';
import { Agent } from 'https';
import { Logger } from 'winston';
import { ConsultResult } from './analysis';
import { BlueprintCore, BlueprintServiceDetail } from './blueprint';
import { DISCOVERY_FACTORS, DISCOVERY_THRESHOLD } from './discovery';
import { SPECIALISTS } from './specialists';
import {
  BusinessConcept,
  BusinessPattern,
  CONCEPT_TYPES,
  ConceptType,
  ConfidenceLevel,
  Hypothesis,
  PatternMatch,
  SolutionState,
  SpecialistDefinition,
  SpecialistNote,
} from './types';
import { randomUUID } from 'crypto';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  // Internal MaaS endpoints may present a certificate from a private CA.
  insecureTls: boolean;
}

export interface AnalysisContext {
  // Questions the user has answered; the model must not ask these again.
  answers: { question: string; answer: string }[];
  conversation: { role: 'user' | 'assistant'; content: string }[];
  message?: string;
}

export interface LlmAnalysis {
  concepts: BusinessConcept[];
  matches: PatternMatch[];
  hypotheses: Hypothesis[];
  questions: string[];
  // Plain-language reply to the user's latest message or a summary of what changed.
  reply: string;
  model: string;
}

export type SpecialistIntent = 'ask' | 'recommend' | 'design' | 'validate' | 'sample';

export interface SpecialistValidation {
  verdict: 'sound' | 'needs-changes' | 'not-a-fit';
  findings: string[];
}

export interface CodeSample {
  language: string;
  title: string;
  code: string;
}

export interface LlmConsultation {
  advice: string;
  questions: string[];
  risks: string[];
  fit?: 'recommended' | 'optional' | 'not-indicated';
  supports: string[];
  constraints: string[];
  validation?: SpecialistValidation;
  model: string;
}

export interface LlmDiscovery {
  // A single message: clarifying questions, or a short summary once understanding is sufficient.
  reply: string;
  factors: { id: string; score: number; note?: string }[];
  model: string;
}

export interface LlmBlueprint {
  core: Partial<BlueprintCore>;
  services: BlueprintServiceDetail[];
  model: string;
}

export interface SpecialistChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SpecialistReply {
  reply: string;
  suggestions: string[];
  samples: CodeSample[];
  validation?: SpecialistValidation;
  followUps: string[];
  model: string;
}

export interface PlannerLlm {
  readonly model: string;
  analyze(
    text: string,
    patterns: BusinessPattern[],
    existing: BusinessConcept[],
    context?: AnalysisContext,
  ): Promise<LlmAnalysis>;
  discover(
    problem: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    patterns: BusinessPattern[],
  ): Promise<LlmDiscovery>;
  blueprint(state: SolutionState, notes: SpecialistNote[]): Promise<LlmBlueprint>;
  consult(
    state: SolutionState,
    specialist: SpecialistDefinition,
    question?: string,
    proposal?: string,
  ): Promise<LlmConsultation>;
  converse(
    specialist: SpecialistDefinition,
    messages: SpecialistChatMessage[],
    intent: SpecialistIntent,
    state?: SolutionState,
  ): Promise<SpecialistReply>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 16000;
const LEVELS: ConfidenceLevel[] = ['high', 'medium', 'low'];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const asString = (value: unknown, max = 1000): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const asStrings = (value: unknown, max = 10): string[] =>
  Array.isArray(value) ? value.map((v) => asString(v)).filter(Boolean).slice(0, max) : [];

export function parseJsonObject(content: string): Record<string, unknown> {
  const stripped = content.replace(/```(?:json)?/gi, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Model response did not contain a JSON object.');
  }
  return JSON.parse(stripped.slice(start, end + 1));
}

const isTransient = (err: unknown): boolean => {
  const axiosErr = err as AxiosError;
  if (axiosErr?.response) {
    return axiosErr.response.status >= 500 || axiosErr.response.status === 429;
  }
  return !!axiosErr?.code && ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(axiosErr.code);
};

const FITS = ['recommended', 'optional', 'not-indicated'] as const;
const VERDICTS = ['sound', 'needs-changes', 'not-a-fit'] as const;
const INTENT_GUIDANCE: Record<SpecialistIntent, string> = {
  ask: 'answer the user\'s question about this service.',
  recommend: 'recommend a service-specific solution for what the user describes.',
  design: 'help refine the user\'s service-specific design, pointing out gaps and better options.',
  validate: 'validate the user\'s proposed solution and give a verdict with specific findings.',
  sample: 'provide concise, realistic sample code or configuration for what the user describes.',
};

const parseValidation = (value: unknown): SpecialistValidation | undefined => {
  const v = (value || {}) as Record<string, unknown>;
  const verdict = VERDICTS.find((x) => x === v.verdict);
  return verdict ? { verdict, findings: asStrings(v.findings) } : undefined;
};

export class MaasLlm implements PlannerLlm {
  private readonly http;

  constructor(private readonly config: LlmConfig, private readonly logger: Logger) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      httpsAgent: new Agent({ rejectUnauthorized: !config.insecureTls }),
    });
  }

  get model(): string {
    return this.config.model;
  }

  private async complete(messages: ChatMessage[]): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      try {
        const { data } = await this.http.post('/chat/completions', {
          model: this.config.model,
          messages,
          temperature: 0.2,
          stream: false,
        });
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new Error('Model returned an empty response.');
        }
        return content;
      } catch (err) {
        if (attempt >= MAX_RETRIES || !isTransient(err)) {
          const status = (err as AxiosError)?.response?.status;
          throw new Error(`Model request failed${status ? ` (HTTP ${status})` : ''}: ${(err as Error).message}`);
        }
        const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
        this.logger.warn(`Model request failed, retrying in ${delay}ms: ${(err as Error).message}`);
        await sleep(delay);
      }
    }
  }

  private async completeJson(messages: ChatMessage[]): Promise<Record<string, unknown>> {
    const content = await this.complete(messages);
    try {
      return parseJsonObject(content);
    } catch (err) {
      this.logger.warn(`Model returned invalid JSON, requesting a corrected response: ${(err as Error).message}`);
      const retry = await this.complete([
        ...messages,
        { role: 'assistant', content },
        { role: 'user', content: 'That was not valid JSON. Reply again with only the JSON object and nothing else.' },
      ]);
      return parseJsonObject(retry);
    }
  }

  async analyze(
    text: string,
    patterns: BusinessPattern[],
    existing: BusinessConcept[],
    context?: AnalysisContext,
  ): Promise<LlmAnalysis> {
    const serviceNames = SPECIALISTS.map((s) => s.service);
    const catalog = patterns.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      services: p.serviceMappings.map((m) => m.service),
    }));
    const services = SPECIALISTS.map((s) => ({ service: s.service, purpose: s.purpose }));

    const system =
      'You are the planning assistant for the Government of Alberta Digital Service Platform (ADSP). ' +
      'Users describe a business problem in plain language; you map it to known business patterns and to the ADSP services that would solve it. ' +
      'Write for non-technical readers. Reply with a single JSON object only, no commentary.';
    const user = [
      `Business problem:\n"""${text}"""`,
      existing.length ? `Concepts already confirmed by the user: ${existing.map((c) => `${c.type}:${c.name}`).join(', ')}` : '',
      context?.answers.length
        ? `The user has already answered these questions (treat the answers as facts and do not ask them again):\n${context.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}`
        : '',
      context?.conversation.length
        ? `Conversation so far:\n${context.conversation.slice(-12).map((m) => `${m.role}: ${m.content}`).join('\n')}`
        : '',
      context?.message ? `The user's latest message (respond to it in "reply" and refine the analysis accordingly): """${context.message}"""` : '',
      `Known business patterns (use these ids): ${JSON.stringify(catalog)}`,
      `ADSP services you may recommend (use these exact names): ${JSON.stringify(services)}`,
      `Return JSON with this shape:
{
  "concepts": [{"type": one of ${JSON.stringify(CONCEPT_TYPES)}, "name": "short name", "description": "one sentence"}],
  "matches": [{"patternId": "<pattern id>", "score": 0-10, "level": "high|medium|low", "explanation": "why it fits, plain language"}],
  "hypotheses": [{"title": "...", "patternId": "<pattern id or empty>", "confidence": "high|medium|low", "rationale": "plain-language explanation of the approach and why", "recommendations": [{"service": "<service name>", "reason": "why this service", "order": 1}], "assumptions": ["..."], "unknowns": ["..."]}],
  "questions": ["clarifying question to ask the user"],
  "reply": "2-4 plain-language sentences: answer the user's latest message if any, otherwise summarize what you understood and what changed"
}
Give up to 6 matches ordered best first, up to 3 hypotheses, 5-12 concepts and up to 6 questions (only questions that are still unanswered). Recommendation order is the suggested implementation order starting at 1.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    return this.mapAnalysis(json, patterns, serviceNames);
  }

  private mapAnalysis(json: Record<string, unknown>, patterns: BusinessPattern[], serviceNames: string[]): LlmAnalysis {
    const patternById = new Map(patterns.map((p) => [p.id, p]));
    const level = (value: unknown): ConfidenceLevel => (LEVELS.includes(value as ConfidenceLevel) ? (value as ConfidenceLevel) : 'low');
    const list = (value: unknown): Record<string, unknown>[] =>
      Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object') : [];

    const concepts = list(json.concepts)
      .map((c) => ({
        id: randomUUID(),
        type: (CONCEPT_TYPES.includes(c.type as ConceptType) ? c.type : 'unknown') as ConceptType,
        name: asString(c.name, 200),
        description: asString(c.description) || undefined,
        source: 'extracted' as const,
        confidence: 0.7,
      }))
      .filter((c) => c.name)
      .slice(0, 20);

    const matches = list(json.matches)
      .filter((m) => patternById.has(asString(m.patternId)))
      .map((m) => {
        const pattern = patternById.get(asString(m.patternId));
        const score = Math.max(0, Math.min(10, Number(m.score) || 0));
        return {
          patternId: pattern.id,
          patternName: pattern.name,
          score,
          level: level(m.level),
          matchedLanguage: [],
          matchedSignals: [],
          explanation: asString(m.explanation),
        };
      })
      .slice(0, 6);

    const hypotheses = list(json.hypotheses)
      .map((h): Hypothesis => {
        const recommendations = list(h.recommendations)
          .filter((r) => serviceNames.includes(asString(r.service)))
          .map((r, i) => ({ service: asString(r.service), reason: asString(r.reason), order: Number(r.order) || i + 1 }))
          .sort((a, b) => a.order - b.order);
        return {
          id: randomUUID(),
          title: asString(h.title, 200) || 'Proposed solution',
          patternId: patternById.has(asString(h.patternId)) ? asString(h.patternId) : '',
          confidence: level(h.confidence),
          rationale: asString(h.rationale, 3000),
          recommendations,
          assumptions: asStrings(h.assumptions),
          unknowns: asStrings(h.unknowns),
        };
      })
      .filter((h) => h.recommendations.length > 0)
      .slice(0, 3);

    if (matches.length === 0 && hypotheses.length === 0) {
      throw new Error('Model response did not contain usable matches or hypotheses.');
    }
    return {
      concepts,
      matches,
      hypotheses,
      questions: asStrings(json.questions, 6),
      reply: asString(json.reply, 2000),
      model: this.config.model,
    };
  }

  async discover(
    problem: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    patterns: BusinessPattern[],
  ): Promise<LlmDiscovery> {
    const system =
      'You are the discovery assistant for the Government of Alberta Digital Service Platform (ADSP). ' +
      'A user describes a business problem in plain language. Before any solution is proposed you hold a short conversation to understand it. ' +
      'Write for non-technical readers. Never propose a solution or name ADSP services in your reply. ' +
      'Reply with a single JSON object only, no commentary.';
    const user = [
      `Business problem:\n"""${problem}"""`,
      messages.length ? `Conversation so far:\n${messages.slice(-16).map((m) => `${m.role}: ${m.content.slice(0, 2000)}`).join('\n')}` : 'No conversation yet.',
      `Business patterns that may apply (for your own context): ${patterns.map((p) => p.name).join(', ')}`,
      `Rate each factor from 0 to 100 for how well the problem and conversation so far define it (0 = unknown, 50 = partly understood, 100 = clear and complete):\n${DISCOVERY_FACTORS.map((f) => `- ${f.id}: ${f.label}`).join('\n')}`,
      `Return JSON: {"factors": [{"id": "<factor id>", "score": 0-100, "note": "what is still unclear, or empty"}], ` +
        `"reply": "ONE message. If the average score is below ${DISCOVERY_THRESHOLD}, ask only the 2-4 most important clarifying questions about the weakest factors as a numbered list, and do not repeat questions already answered. If the average is ${DISCOVERY_THRESHOLD} or higher, write 2-3 sentences summarizing your understanding and say you will now present the proposed solution."}`,
    ].join('\n\n');
    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    const reply = asString(json.reply, 3000);
    const factors = (Array.isArray(json.factors) ? json.factors : [])
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map((f) => ({ id: asString(f.id, 50), score: Number(f.score) || 0, note: asString(f.note, 300) || undefined }))
      .filter((f) => DISCOVERY_FACTORS.some((d) => d.id === f.id));
    if (!reply || factors.length === 0) {
      throw new Error('Model response did not contain a discovery message and factor scores.');
    }
    return { reply, factors, model: this.config.model };
  }

  async blueprint(state: SolutionState, notes: SpecialistNote[]): Promise<LlmBlueprint> {
    const system =
      'You are the solution architect for the Government of Alberta Digital Service Platform (ADSP). ' +
      'Turn the proposed solution and the specialist consultation notes into a complete project blueprint. ' +
      'Use only the ADSP services listed. Be specific to this problem, practical and concise; write for a mixed business and technical audience. ' +
      'Reply with a single JSON object only, no commentary.';
    const hypothesis = state.hypotheses[0];
    const user = [
      `Problem statement:\n"""${state.problemStatement}"""`,
      state.discovery?.messages.length
        ? `Discovery conversation:\n${state.discovery.messages.slice(-12).map((m) => `${m.role}: ${m.content.slice(0, 1200)}`).join('\n')}`
        : '',
      hypothesis
        ? `Proposed approach: ${hypothesis.title} — ${hypothesis.rationale}\nServices in order:\n${[...hypothesis.recommendations]
            .sort((a, b) => a.order - b.order)
            .map((r) => `${r.order}. ${r.service}: ${r.reason}`)
            .join('\n')}`
        : '',
      state.concepts.length ? `Business concepts: ${state.concepts.slice(0, 30).map((c) => `${c.type}:${c.name}`).join(', ')}` : '',
      notes.length
        ? `Specialist notes:\n${notes
            .map((n) => `- ${n.service} (${n.fit}): ${n.summary.slice(0, 700)} Constraints: ${n.constraints.slice(0, 3).join('; ')}. Risks: ${n.risks.slice(0, 3).join('; ')}`)
            .join('\n')}`
        : '',
      'Return JSON: {"overview": {"summary": "short paragraph", "objectives": [], "scope": [], "outOfScope": [], "stakeholders": [], "successMeasures": [], "risks": []}, ' +
        '"architecture": {"summary": "", "layers": [{"name": "", "description": "", "components": []}], "integrations": [], "security": []}, ' +
        '"services": [{"service": "<service id>", "role": "what it does in this solution", "capabilities": ["specific features to use"]}], ' +
        '"workflows": [{"name": "", "actors": [], "steps": ["ordered steps naming the service used"]}], ' +
        '"dataGovernance": {"dataEntities": [], "accessControl": [], "retention": [], "privacy": [], "audit": [], "compliance": []}, ' +
        '"delivery": {"phases": [{"name": "", "items": []}], "nonFunctional": [], "openQuestions": []}}. ' +
        'Keep every list to at most 8 items, and every item to one sentence.',
    ]
      .filter(Boolean)
      .join('\n\n');
    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    const obj = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
    const objs = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.filter((v) => v && typeof v === 'object').map(obj) : []);
    const overview = obj(json.overview);
    const architecture = obj(json.architecture);
    const governance = obj(json.dataGovernance);
    const delivery = obj(json.delivery);
    const serviceNames = SPECIALISTS.map((s) => s.service);
    const core: Partial<BlueprintCore> = {
      overview: {
        title: '',
        summary: asString(overview.summary, 2500),
        objectives: asStrings(overview.objectives, 8),
        scope: asStrings(overview.scope, 8),
        outOfScope: asStrings(overview.outOfScope, 8),
        stakeholders: asStrings(overview.stakeholders, 8),
        successMeasures: asStrings(overview.successMeasures, 8),
        risks: asStrings(overview.risks, 8),
      },
      architecture: {
        summary: asString(architecture.summary, 1500),
        layers: objs(architecture.layers)
          .slice(0, 8)
          .map((l) => ({ name: asString(l.name, 80), description: asString(l.description, 400), components: asStrings(l.components, 10) }))
          .filter((l) => l.name),
        integrations: asStrings(architecture.integrations, 8),
        security: asStrings(architecture.security, 8),
        diagram: '',
      },
      workflows: objs(json.workflows)
        .slice(0, 6)
        .map((w) => ({ name: asString(w.name, 120), actors: asStrings(w.actors, 8), steps: asStrings(w.steps, 12) }))
        .filter((w) => w.name && w.steps.length > 0),
      dataGovernance: {
        dataEntities: asStrings(governance.dataEntities, 8),
        accessControl: asStrings(governance.accessControl, 8),
        retention: asStrings(governance.retention, 8),
        privacy: asStrings(governance.privacy, 8),
        audit: asStrings(governance.audit, 8),
        compliance: asStrings(governance.compliance, 8),
      },
      delivery: {
        phases: objs(delivery.phases)
          .slice(0, 8)
          .map((p) => ({ name: asString(p.name, 100), items: asStrings(p.items, 8) }))
          .filter((p) => p.name),
        nonFunctional: asStrings(delivery.nonFunctional, 8),
        openQuestions: asStrings(delivery.openQuestions, 8),
      },
    };
    const services = objs(json.services)
      .filter((s) => serviceNames.includes(asString(s.service)))
      .map((s) => ({ service: asString(s.service), role: asString(s.role, 500), capabilities: asStrings(s.capabilities, 6) }));
    if (!core.overview?.summary && !core.architecture?.layers.length && !core.workflows?.length) {
      throw new Error('Model response did not contain a usable blueprint.');
    }
    return { core, services, model: this.config.model };
  }

  async consult(
    state: SolutionState,
    specialist: SpecialistDefinition,
    question?: string,
    proposal?: string,
  ): Promise<LlmConsultation> {
    const system =
      `You are the ADSP ${specialist.displayName} specialist for the Government of Alberta. ` +
      'The planner is consulting you about a proposed solution. Decide whether this service is a good fit, ' +
      'which parts of the solution it can support, constraints, dependencies and risks the planner may not have ' +
      'considered, and validate any plan the planner proposes. Be practical and honest; say when the service is not a fit. ' +
      'Reply with a single JSON object only, no commentary.';
    const user = [
      `Service purpose: ${specialist.purpose}`,
      `Known dependencies: ${specialist.dependsOn.join(', ') || 'none'}`,
      `Problem statement:\n"""${state.problemStatement}"""`,
      `Recommended approach: ${state.hypotheses[0] ? `${state.hypotheses[0].title} — ${state.hypotheses[0].rationale}` : 'not analyzed yet'}`,
      state.concepts.length ? `Business concepts: ${state.concepts.slice(0, 20).map((c) => `${c.type}:${c.name}`).join(', ')}` : '',
      proposal ? `Plan to validate:\n"""${proposal}"""` : '',
      question ? `The planner asks: ${question}` : 'Explain how to use this service for this solution and what to decide first.',
      'Return JSON: {"fit": "recommended|optional|not-indicated", "advice": "2-5 short paragraphs as one string", ' +
        '"supports": ["parts of the solution this service can support"], "constraints": ["constraints or limits to respect"], ' +
        '"questions": ["questions to resolve before configuring the service"], "risks": ["risks or pitfalls not yet considered"], ' +
        '"validation": {"verdict": "sound|needs-changes|not-a-fit", "findings": ["findings about the plan"]} (only when a plan was supplied)}',
    ]
      .filter(Boolean)
      .join('\n\n');

    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    const advice = asString(json.advice, 6000);
    if (!advice) {
      throw new Error('Model response did not contain advice.');
    }
    const fit = FITS.find((f) => f === json.fit);
    return {
      advice,
      questions: asStrings(json.questions),
      risks: asStrings(json.risks),
      fit,
      supports: asStrings(json.supports),
      constraints: asStrings(json.constraints),
      validation: parseValidation(json.validation),
      model: this.config.model,
    };
  }

  async converse(
    specialist: SpecialistDefinition,
    messages: SpecialistChatMessage[],
    intent: SpecialistIntent,
    state?: SolutionState,
  ): Promise<SpecialistReply> {
    const system =
      `You are the ADSP ${specialist.displayName} specialist for the Government of Alberta, talking directly with a user ` +
      'who may already know they want this service. Answer questions, recommend service-specific solutions, help refine ' +
      'service-specific designs, validate proposed solutions, and provide short sample code when useful. ' +
      'Stay within what this service does; if something belongs to another ADSP service, say so. Never invent APIs; ' +
      'if unsure, say what to verify. ' +
      `Service purpose: ${specialist.purpose} Dependencies: ${specialist.dependsOn.join(', ') || 'none'}. ` +
      `Known pitfalls: ${specialist.risks.join(' ') || 'none recorded'}. ` +
      `Current task: ${INTENT_GUIDANCE[intent]} ` +
      (state ? `Solution context: """${state.problemStatement}""". ` : '') +
      'Reply with a single JSON object only: {"reply": "markdown answer", "suggestions": ["concrete recommendations"], ' +
      '"samples": [{"language": "typescript|json|http", "title": "short", "code": "code"}], ' +
      '"validation": {"verdict": "sound|needs-changes|not-a-fit", "findings": ["..."]} (only when validating), ' +
      '"followUps": ["useful next questions the user could ask"]}';
    const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    const json = await this.completeJson([{ role: 'system', content: system }, ...history]);
    const reply = asString(json.reply, 8000);
    if (!reply) {
      throw new Error('Model response did not contain a reply.');
    }
    const samples = (Array.isArray(json.samples) ? json.samples : [])
      .map((s) => {
        const sample = (s || {}) as Record<string, unknown>;
        return {
          language: asString(sample.language, 30) || 'text',
          title: asString(sample.title, 120),
          code: asString(sample.code, 6000),
        };
      })
      .filter((s) => s.code)
      .slice(0, 4);
    return {
      reply,
      suggestions: asStrings(json.suggestions),
      samples,
      validation: parseValidation(json.validation),
      followUps: asStrings(json.followUps, 5),
      model: this.config.model,
    };
  }
}
export const mergeConsultation = (base: ConsultResult, ai: LlmConsultation): ConsultResult => ({
  ...base,
  advice: ai.advice,
  questions: [...new Set([...ai.questions, ...base.questions])],
  risks: [...new Set([...ai.risks, ...base.risks])],
  fit: ai.fit || base.fit,
  supports: ai.supports,
  constraints: ai.constraints,
  validation: ai.validation,
});

export function createLlmFromEnv(env: Record<string, string | undefined>, logger: Logger): PlannerLlm | undefined {
  if (!env.MAAS_API_KEY) {
    return undefined;
  }
  return new MaasLlm(
    {
      baseUrl: env.MAAS_BASE_URL || 'https://maas.int.gov.ab.ca/v1',
      apiKey: env.MAAS_API_KEY,
      model: env.MAAS_MODEL || 'GOA-Default',
      timeoutMs: Number(env.MAAS_TIMEOUT_MS) || 120000,
      insecureTls: env.MAAS_INSECURE_TLS === 'true',
    },
    logger,
  );
}
