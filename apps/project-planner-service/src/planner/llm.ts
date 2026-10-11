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

export interface LlmAnalysis {
  concepts: BusinessConcept[];
  matches: PatternMatch[];
  hypotheses: Hypothesis[];
  questions: string[];
  model: string;
}

export interface LlmConsultation {
  advice: string;
  questions: string[];
  risks: string[];
  model: string;
}

export interface PlannerLlm {
  readonly model: string;
  analyze(text: string, patterns: BusinessPattern[], existing: BusinessConcept[]): Promise<LlmAnalysis>;
  consult(state: SolutionState, specialist: SpecialistDefinition, question?: string): Promise<LlmConsultation>;
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

  async analyze(text: string, patterns: BusinessPattern[], existing: BusinessConcept[]): Promise<LlmAnalysis> {
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
      `Known business patterns (use these ids): ${JSON.stringify(catalog)}`,
      `ADSP services you may recommend (use these exact names): ${JSON.stringify(services)}`,
      `Return JSON with this shape:
{
  "concepts": [{"type": one of ${JSON.stringify(CONCEPT_TYPES)}, "name": "short name", "description": "one sentence"}],
  "matches": [{"patternId": "<pattern id>", "score": 0-10, "level": "high|medium|low", "explanation": "why it fits, plain language"}],
  "hypotheses": [{"title": "...", "patternId": "<pattern id or empty>", "confidence": "high|medium|low", "rationale": "plain-language explanation of the approach and why", "recommendations": [{"service": "<service name>", "reason": "why this service", "order": 1}], "assumptions": ["..."], "unknowns": ["..."]}],
  "questions": ["clarifying question to ask the user"]
}
Give up to 6 matches ordered best first, up to 3 hypotheses, 5-12 concepts and up to 6 questions. Recommendation order is the suggested implementation order starting at 1.`,
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
    return { concepts, matches, hypotheses, questions: asStrings(json.questions, 6), model: this.config.model };
  }

  async consult(state: SolutionState, specialist: SpecialistDefinition, question?: string): Promise<LlmConsultation> {
    const system =
      `You are the ADSP ${specialist.displayName} specialist for the Government of Alberta. ` +
      'Give practical, plain-language guidance for how this service applies to the user\'s solution. ' +
      'Reply with a single JSON object only, no commentary.';
    const user = [
      `Service purpose: ${specialist.purpose}`,
      `Problem statement:\n"""${state.problemStatement}"""`,
      `Recommended approach: ${state.hypotheses[0] ? `${state.hypotheses[0].title} — ${state.hypotheses[0].rationale}` : 'not analyzed yet'}`,
      state.concepts.length ? `Business concepts: ${state.concepts.slice(0, 20).map((c) => `${c.type}:${c.name}`).join(', ')}` : '',
      question ? `The user asks: ${question}` : 'Explain how to use this service for this solution and what to decide first.',
      'Return JSON: {"advice": "2-5 short paragraphs as one string", "questions": ["questions to resolve before configuring the service"], "risks": ["risks or pitfalls"]}',
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
    return { advice, questions: asStrings(json.questions), risks: asStrings(json.risks), model: this.config.model };
  }
}

export const mergeConsultation = (base: ConsultResult, ai: LlmConsultation): ConsultResult => ({
  ...base,
  advice: ai.advice,
  questions: [...new Set([...ai.questions, ...base.questions])],
  risks: [...new Set([...ai.risks, ...base.risks])],
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
