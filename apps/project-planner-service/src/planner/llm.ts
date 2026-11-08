import axios, { AxiosError } from 'axios';
import { Logger } from 'winston';
import { ConsultResult } from './analysis';
import { AcceptanceDraft, AcceptanceReference, criteriaGroups } from './acceptance';
import { BlueprintCore, BlueprintServiceDetail } from './blueprint';
import { ADSP_COMPONENT_MAP, ComponentDraft } from './components';
import { DISCOVERY_FACTORS, DISCOVERY_THRESHOLD } from './discovery';
import { SPECIALISTS } from './specialists';
import {
  BlueprintRole,
  BusinessConcept,
  BusinessPattern,
  CONCEPT_TYPES,
  ConceptType,
  ConfidenceLevel,
  Hypothesis,
  PatternMatch,
  PatternUnsupportedCapability,
  PRODUCT_TYPES,
  ProductType,
  SolutionBlueprint,
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
}

export interface AnalysisContext {
  // Questions the user has answered; the model must not ask these again.
  answers: { question: string; answer: string }[];
  conversation: { role: 'user' | 'assistant'; content: string }[];
  message?: string;
  openQuestions?: { id: string; question: string }[];
}

export interface LlmAnalysis {
  concepts: BusinessConcept[];
  matches: PatternMatch[];
  hypotheses: Hypothesis[];
  questions: string[];
  resolvedQuestionIds: string[];
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
  notCoveredByAdsp: PatternUnsupportedCapability[];
  components: ComponentDraft[];
  model: string;
}

export interface LlmAcceptance {
  criteria: AcceptanceDraft[];
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
  // Candidates are live ADSP services missing from the component map that may still have components.
  blueprint(state: SolutionState, notes: SpecialistNote[], candidates?: string[]): Promise<LlmBlueprint>;
  // Each draft cites one reference key as its source; the caller checks it against the plan.
  acceptanceCriteria(blueprint: SolutionBlueprint, references: AcceptanceReference[]): Promise<LlmAcceptance>;
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
  Array.isArray(value)
    ? value
        .map((v) => asString(v))
        .filter(Boolean)
        .slice(0, max)
    : [];
const asNotCovered = (value: unknown, max = 10): PatternUnsupportedCapability[] =>
  (Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object') : [])
    .map((n) => ({
      requirement: asString(n.requirement, 80),
      reason: asString(n.reason, 500),
      suggestedApproach: asString(n.suggestedApproach, 500),
      category: asString(n.category, 50) || undefined,
    }))
    .filter((n) => n.requirement && n.reason)
    .slice(0, max);

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
  return (
    !!axiosErr?.code && ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(axiosErr.code)
  );
};

const FITS = ['recommended', 'optional', 'not-indicated'] as const;
const VERDICTS = ['sound', 'needs-changes', 'not-a-fit'] as const;
const INTENT_GUIDANCE: Record<SpecialistIntent, string> = {
  ask: "answer the user's question about this service.",
  recommend: 'recommend a service-specific solution for what the user describes.',
  design: "help refine the user's service-specific design, pointing out gaps and better options.",
  validate: "validate the user's proposed solution and give a verdict with specific findings.",
  sample: 'provide concise, realistic sample code or configuration for what the user describes.',
};

const parseValidation = (value: unknown): SpecialistValidation | undefined => {
  const v = (value || {}) as Record<string, unknown>;
  const verdict = VERDICTS.find((x) => x === v.verdict);
  return verdict ? { verdict, findings: asStrings(v.findings) } : undefined;
};

export class MaasLlm implements PlannerLlm {
  private readonly http;

  constructor(
    private readonly config: LlmConfig,
    private readonly logger: Logger,
  ) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
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
      existing.length
        ? `Concepts already confirmed by the user: ${existing.map((c) => `${c.type}:${c.name}`).join(', ')}`
        : '',
      context?.answers.length
        ? `The user has already answered these questions (treat the answers as facts and do not ask them again):\n${context.answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}`
        : '',
      context?.openQuestions?.length
        ? `These questions are still open (ids shown). Check the business problem, conversation and latest message against each one: if it is now answered, put its id in "resolvedQuestionIds". Do not propose a new question that duplicates or rephrases one that is still open and unresolved.\n${context.openQuestions.map((q) => `${q.id}: ${q.question}`).join('\n')}`
        : '',
      context?.conversation.length
        ? `Conversation so far:\n${context.conversation
            .slice(-12)
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')}`
        : '',
      context?.message
        ? `The user's latest message (respond to it in "reply" and refine the analysis accordingly): """${context.message}"""`
        : '',
      `Known business patterns (use these ids): ${JSON.stringify(catalog)}`,
      `ADSP services you may recommend (use these exact names): ${JSON.stringify(services)}`,
      `Return JSON with this shape:
{
  "concepts": [{"type": one of ${JSON.stringify(CONCEPT_TYPES)}, "name": "short name", "description": "one sentence"}],
  "matches": [{"patternId": "<pattern id>", "score": 0-10, "level": "high|medium|low", "explanation": "why it fits, plain language"}],
  "hypotheses": [{"title": "...", "patternId": "<pattern id or empty>", "confidence": "high|medium|low", "rationale": "plain-language explanation of the approach and why", "recommendations": [{"service": "<service name>", "reason": "why this service", "order": 1}], "assumptions": ["..."], "unknowns": ["..."]}],
  "questions": ["clarifying question to ask the user"],
  "resolvedQuestionIds": ["<id from the open questions list above that the conversation now answers>"],
  "reply": "2-4 plain-language sentences: answer the user's latest message if any, otherwise summarize what you understood and what changed"
}
Give up to 6 matches ordered best first, up to 3 hypotheses, 5-12 concepts and up to 6 questions (only questions that are still unanswered and not already covered by an open question above). Recommendation order is the suggested implementation order starting at 1.`,
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
    const level = (value: unknown): ConfidenceLevel =>
      LEVELS.includes(value as ConfidenceLevel) ? (value as ConfidenceLevel) : 'low';
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
          .map((r, i) => ({
            service: asString(r.service),
            reason: asString(r.reason),
            order: Number(r.order) || i + 1,
          }))
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
      resolvedQuestionIds: asStrings(json.resolvedQuestionIds, 20),
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
      messages.length
        ? `Conversation so far:\n${messages
            .slice(-16)
            .map((m) => `${m.role}: ${m.content.slice(0, 2000)}`)
            .join('\n')}`
        : 'No conversation yet.',
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

  async blueprint(state: SolutionState, notes: SpecialistNote[], candidates: string[] = []): Promise<LlmBlueprint> {
    const componentServices = [...Object.keys(ADSP_COMPONENT_MAP), ...candidates];
    const system =
      'You are the solution architect for the Government of Alberta Digital Service Platform (ADSP). ' +
      'Turn the proposed solution and the specialist consultation notes into a complete project blueprint. ' +
      'Use only the ADSP services listed. Be specific to this problem, practical and concise; write for a mixed business and technical audience. ' +
      'Reply with a single JSON object only, no commentary.';
    const hypothesis = state.hypotheses[0];
    const currentComponents = (state.blueprint?.components || []).filter((c) => c.target === 'adsp');
    const user = [
      `Problem statement:\n"""${state.problemStatement}"""`,
      state.discovery?.messages.length
        ? `Discovery conversation:\n${state.discovery.messages
            .slice(-12)
            .map((m) => `${m.role}: ${m.content.slice(0, 1200)}`)
            .join('\n')}`
        : '',
      hypothesis
        ? `Proposed approach: ${hypothesis.title} — ${hypothesis.rationale}\nServices in order:\n${[
            ...hypothesis.recommendations,
          ]
            .sort((a, b) => a.order - b.order)
            .map((r) => `${r.order}. ${r.service}: ${r.reason}`)
            .join('\n')}`
        : '',
      state.concepts.length
        ? `Business concepts: ${state.concepts
            .slice(0, 30)
            .map((c) => `${c.type}:${c.name}`)
            .join(', ')}`
        : '',
      notes.length
        ? `Specialist notes:\n${notes
            .map(
              (n) =>
                `- ${n.service} (${n.fit}): ${n.summary.slice(0, 700)} Constraints: ${n.constraints.slice(0, 3).join('; ')}. Risks: ${n.risks.slice(0, 3).join('; ')}`,
            )
            .join('\n')}`
        : '',
      currentComponents.length
        ? `Current components (reviews follow a component by its service and name, so keep the exact service and name of any that still serves the same purpose):\n${currentComponents
            .map((c) => `- ${c.service}: ${c.name}`)
            .join('\n')}`
        : '',
      'Return JSON: {"overview": {"summary": "short paragraph", "objectives": [], "scope": [], "outOfScope": [], "stakeholders": [], "successMeasures": [], "risks": [], ' +
        '"roles": [{"actor": "", "appRole": "what they do in the app", "productType": "public-form | workspace | empty if unsure"}]}, ' +
        '"architecture": {"summary": "", "layers": [{"name": "", "description": "", "components": []}], "integrations": [], "security": []}, ' +
        '"services": [{"service": "<service id>", "role": "what it does in this solution", "capabilities": ["specific features to use"]}], ' +
        '"workflows": [{"name": "", "actors": [], "steps": ["ordered steps naming the service used"]}], ' +
        '"dataGovernance": {"dataEntities": [], "accessControl": [], "retention": [], "privacy": [], "audit": [], "compliance": []}, ' +
        '"delivery": {"phases": [{"name": "", "items": []}], "nonFunctional": [], "openQuestions": []}, ' +
        '"notCoveredByAdsp": [{"requirement": "a short capability name, 3-6 words, not copied verbatim from the problem statement", ' +
        '"reason": "why no listed ADSP service covers it", "suggestedApproach": "how to build it outside ADSP", ' +
        '"category": "payment-collection if this is about collecting a fee, payment, or deposit from the public (omit this field otherwise)"}], ' +
        '"components": [{"service": "<service id>", "type": "kind of item, e.g. Form definition", "name": "", "purpose": "", "dependsOn": ["other component names"], "openDecisions": []}]}. ' +
        'For notCoveredByAdsp: if a listed service already covers part of a need, describe only the remaining uncovered capability, not the whole need. ' +
        'Combine gaps that would be solved by the same custom-built capability into a single item instead of listing them separately. ' +
        'If a specialist note says a capability is genuinely unsupported (such as time-based scheduling), list it in notCoveredByAdsp too, not only as a risk. ' +
        'Keep every list to at most 8 items, and every item to one sentence. ' +
        'Give each actor one role row with the GoA product type of the app they use. ' +
        'public-form: For citizen-facing services where users apply for a benefit, request a service, or submit information. Designed around simplicity and low cognitive load, with plain-language questions, focused pages that ask one thing at a time, save-and-resume, and a clear confirmation of what happens next. ' +
        'workspace: for productivity-focused services that service delivery staff use as a daily tool to review information, manage records, and complete tasks. The design prioritizes efficiency and accuracy. ' +
        'Leave productType empty if unsure. ' +
        `Components are the concrete items to set up in each ADSP service, in setup order. Components may use: ${componentServices.join(', ')}.`,
    ]
      .filter(Boolean)
      .join('\n\n');
    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    const obj = (value: unknown): Record<string, unknown> =>
      value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const objs = (value: unknown): Record<string, unknown>[] =>
      Array.isArray(value) ? value.filter((v) => v && typeof v === 'object').map(obj) : [];
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
        roles: objs(overview.roles)
          .slice(0, 8)
          .map((r): BlueprintRole => ({
            actor: asString(r.actor, 120),
            appRole: asString(r.appRole, 300),
            productType: PRODUCT_TYPES.includes(r.productType as ProductType) ? (r.productType as ProductType) : '',
          }))
          .filter((r) => r.actor),
      },
      architecture: {
        summary: asString(architecture.summary, 1500),
        layers: objs(architecture.layers)
          .slice(0, 8)
          .map((l) => ({
            name: asString(l.name, 80),
            description: asString(l.description, 400),
            components: asStrings(l.components, 10),
          }))
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
      .map((s) => ({
        service: asString(s.service),
        role: asString(s.role, 500),
        capabilities: asStrings(s.capabilities, 6),
      }));
    const notCoveredByAdsp = asNotCovered(json.notCoveredByAdsp);
    const components = objs(json.components)
      .slice(0, 30)
      .map((c) => ({
        service: asString(c.service),
        type: asString(c.type, 80) || undefined,
        name: asString(c.name, 120),
        purpose: asString(c.purpose, 400),
        dependsOn: asStrings(c.dependsOn, 6),
        openDecisions: asStrings(c.openDecisions, 6),
      }))
      .filter((c) => c.name && componentServices.includes(c.service));
    if (!core.overview?.summary && !core.architecture?.layers.length && !core.workflows?.length) {
      throw new Error('Model response did not contain a usable blueprint.');
    }
    return { core, services, notCoveredByAdsp, components, model: this.config.model };
  }

  async acceptanceCriteria(blueprint: SolutionBlueprint, references: AcceptanceReference[]): Promise<LlmAcceptance> {
    const system =
      'You write acceptance criteria that a generated application is checked against. ' +
      'Each criterion restates one item from the plan as a testable Given / When / Then check. ' +
      'Never add behaviour, numbers or rules the plan does not state; skip anything the plan is silent on. ' +
      'Reply with a single JSON object only, no commentary.';
    const groups = criteriaGroups(blueprint);
    const user = [
      `Plan: ${blueprint.overview.title} — ${blueprint.overview.summary}`,
      `Plan items (key: text):\n${references.map((r) => `${r.key}: ${r.text}`).join('\n')}`,
      `Groups: ${groups.map((g) => `"${g}"`).join(', ')}`,
      'Return JSON: {"criteria": [{"group": "one of the groups", "actor": "who acts, if the item names one", ' +
        '"given": "", "when": "", "then": "the observable result", "source": "the key of the plan item it restates"}]}. ' +
        'Put criteria about a workflow in that workflow group; put access, audit, retention, privacy, compliance and non-functional criteria in Rules. ' +
        'Leave given or when empty when the item does not state them. Keep each field to one sentence.',
    ].join('\n\n');
    const json = await this.completeJson([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
    const criteria = (Array.isArray(json.criteria) ? json.criteria : [])
      .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
      .slice(0, 60)
      .map((c) => ({
        group: asString(c.group, 120),
        actor: asString(c.actor, 120) || undefined,
        given: asString(c.given, 500) || undefined,
        when: asString(c.when, 500) || undefined,
        then: asString(c.then, 500),
        source: asString(c.source, 120),
      }))
      .filter((c) => c.then && c.source);
    if (criteria.length === 0) {
      throw new Error('Model response did not contain acceptance criteria.');
    }
    return { criteria, model: this.config.model };
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
      state.concepts.length
        ? `Business concepts: ${state.concepts
            .slice(0, 20)
            .map((c) => `${c.type}:${c.name}`)
            .join(', ')}`
        : '',
      proposal ? `Plan to validate:\n"""${proposal}"""` : '',
      question
        ? `The planner asks: ${question}`
        : 'Explain how to use this service for this solution and what to decide first.',
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
    },
    logger,
  );
}
