import axios, { AxiosError } from 'axios';
import { Agent } from 'https';
import { Logger } from 'winston';
import { ConsultResult } from './analysis';
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
