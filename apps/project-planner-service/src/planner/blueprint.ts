import { ConsultResult } from './analysis';
import { getSpecialist } from './specialists';
import {
  BlueprintLayer,
  BlueprintServiceRole,
  BusinessConcept,
  BusinessPattern,
  ConceptType,
  SolutionBlueprint,
  SolutionState,
  SpecialistNote,
  StoredChatMessage,
} from './types';

// The parts of a blueprint that are authored (by the model or by rules); the rest is assembled from the solution.
export type BlueprintCore = Pick<SolutionBlueprint, 'overview' | 'architecture' | 'workflows' | 'dataGovernance' | 'delivery'>;

export interface BlueprintServiceDetail {
  service: string;
  role?: string;
  capabilities?: string[];
}

const unique = (items: string[]): string[] => [...new Set(items.map((i) => i.trim()).filter(Boolean))];
const names = (concepts: BusinessConcept[], ...types: ConceptType[]): string[] =>
  unique(concepts.filter((c) => types.includes(c.type)).map((c) => c.name));
const nonEmpty = <T>(value: T[] | undefined, fallback: T[]): T[] => (value && value.length > 0 ? value : fallback);

export const recommendedServices = (state: SolutionState) =>
  [...(state.hypotheses[0]?.recommendations || [])].sort((a, b) => a.order - b.order);

// Text diagram built from the layers, so it is always consistent with them.
export function buildDiagram(layers: BlueprintLayer[]): string {
  const width = 76;
  const wrap = (text: string): string[] => {
    const rows: string[] = [];
    let row = '';
    for (const word of text.split(' ')) {
      if (row && `${row} ${word}`.length > width - 2) {
        rows.push(row);
        row = `  ${word}`;
      } else {
        row = row ? `${row} ${word}` : word;
      }
    }
    return [...rows, row];
  };
  const line = `+${'-'.repeat(width)}+`;
  const boxes = layers.map((l) => wrap(`${l.name}: ${l.components.join(', ')}`).map((r) => `| ${r.padEnd(width - 2)} |`));
  const arrow = `${' '.repeat(Math.floor(width / 2))}v`;
  return boxes.flatMap((rows, i) => [line, ...rows, ...(i < boxes.length - 1 ? [arrow] : [line])]).join('\n');
}

export function buildServiceMapping(state: SolutionState, details: BlueprintServiceDetail[] = []): BlueprintServiceRole[] {
  return recommendedServices(state).map((rec) => {
    const specialist = getSpecialist(rec.service);
    const detail = details.find((d) => d.service === rec.service);
    return {
      order: rec.order,
      service: rec.service,
      displayName: specialist?.displayName || rec.service,
      role: detail?.role || specialist?.purpose || rec.reason,
      reason: rec.reason,
      dependsOn: specialist?.dependsOn || [],
      capabilities: detail?.capabilities?.length ? detail.capabilities : specialist?.questions.slice(0, 3) || [],
    };
  });
}

// Rule-based blueprint, used directly without AI and as the base the AI output is merged over.
export function buildRuleBlueprint(state: SolutionState, pattern?: BusinessPattern): BlueprintCore {
  const hypothesis = state.hypotheses[0];
  const services = recommendedServices(state);
  const serviceList = services.map((s) => s.service);
  const actors = names(state.concepts, 'actor');
  const has = (service: string) => serviceList.includes(service);

  const layers: BlueprintLayer[] = [
    {
      name: 'Experience',
      description: 'Web application for each user group, built with the GoA Design System 2.0.',
      components: actors.length ? actors.map((a) => `${a} view`) : ['Web application'],
    },
    {
      name: 'ADSP services',
      description: 'Platform capabilities, used in the order they are needed by the main workflow.',
      components: serviceList.length ? serviceList : ['(none recommended yet)'],
    },
    {
      name: 'Events & notification',
      description: 'Domain events record what happened and drive notices and live updates.',
      components: unique(['Event service', ...(has('notification-service') ? ['Notification service'] : []), ...(has('push-service') ? ['Push service'] : [])]),
    },
    {
      name: 'Data & files',
      description: 'Records are stored by the services that own them; each is tenant-scoped.',
      components: unique([has('form-service') ? 'Form submissions' : '', has('file-service') ? 'Files and documents' : '', has('value-service') ? 'Metrics values' : '', 'Service-owned records']),
    },
    {
      name: 'Identity & access',
      description: 'Keycloak realm per tenant; roles are checked by every service.',
      components: ['Keycloak (OIDC/JWT)', 'Tenant service', 'Service roles'],
    },
  ];

  const workflowConcepts = state.concepts.filter((c) => c.type === 'workflow').slice(0, 3);
  const workflows = [
    {
      name: hypothesis ? `Core workflow — ${hypothesis.title}` : 'Core workflow',
      actors,
      steps: services.map((s) => `${s.order}. ${s.service}: ${s.reason}`),
    },
    ...workflowConcepts.map((c) => ({
      name: c.name,
      actors,
      steps: unique([...(pattern?.commonFeatures || []).slice(0, 4), c.description || '']),
    })),
  ].filter((w) => w.steps.length > 0);

  return {
    overview: {
      title: hypothesis?.title || 'Proposed solution',
      summary: hypothesis?.rationale || state.problemStatement,
      objectives: nonEmpty(names(state.concepts, 'goal', 'outcome'), [state.problemStatement.slice(0, 200)].filter(Boolean)),
      scope: nonEmpty((pattern?.commonFeatures || []).slice(0, 8), names(state.concepts, 'activity')),
      outOfScope: ['Systems and processes not named in the problem statement', 'Custom code where an ADSP service already fits'],
      stakeholders: actors,
      successMeasures: nonEmpty(names(state.concepts, 'evaluation-criterion', 'outcome'), ['Agree measurable success criteria with the business owner']),
      risks: unique([...(hypothesis?.unknowns || []), ...services.flatMap((s) => getSpecialist(s.service)?.risks.slice(0, 1) || [])]),
    },
    architecture: {
      summary: serviceList.length
        ? `A tenant-scoped solution composed from ${serviceList.length} ADSP service(s): ${serviceList.join(', ')}.`
        : 'No services recommended yet — analyze the problem first.',
      layers,
      integrations: names(state.concepts, 'external-system'),
      security: [
        'Authenticate with tenant JWTs; authorize with service roles',
        'Least-privilege roles per user group',
        'No secrets in code or configuration; use platform-managed credentials',
      ],
      diagram: buildDiagram(layers),
    },
    workflows,
    dataGovernance: {
      dataEntities: nonEmpty(names(state.concepts, 'document', 'evidence', 'outcome', 'decision'), ['Define the main records the solution creates']),
      accessControl: actors.length ? actors.map((a) => `${a}: define view and edit rights`) : ['Define roles per user group'],
      retention: ['Set a retention period for each record type', 'Define archive and deletion triggers'],
      privacy: ['Complete a privacy impact assessment where personal information is collected', 'Collect only what the process needs'],
      audit: ['Signal domain events for each significant state change', 'Keep the event log as the audit trail'],
      compliance: unique(['FOIP and applicable program legislation', 'WCAG 2.1 AA accessibility', 'GoA Design System 2.0', ...names(state.concepts, 'business-rule', 'constraint').slice(0, 4)]),
    },
    delivery: {
      phases: [
        { name: 'Discover & design', items: ['Confirm scope and success measures', 'Resolve open questions', 'Consult each recommended service specialist'] },
        { name: 'Foundation', items: ['Create the tenant configuration and roles', ...serviceList.slice(0, 2).map((s) => `Set up ${s}`)] },
        { name: 'Build the core workflow', items: services.map((s) => `Configure ${s.service}`) },
        { name: 'Test & accept', items: ['Unit and end-to-end tests', 'Accessibility review', 'User acceptance testing'] },
        { name: 'Release & operate', items: ['Promote through dev, test and production', 'Monitor with the Status service', 'Review metrics and iterate'] },
      ],
      nonFunctional: ['Accessibility (WCAG 2.1 AA)', 'Availability and monitoring', 'Performance at expected volumes', 'Security and privacy'],
      openQuestions: unique(state.questions.filter((q) => q.status === 'open').map((q) => q.question)),
    },
  };
}

// AI output wins section by section when it supplied something; the rule-based blueprint fills any gaps.
export function mergeBlueprintCore(base: BlueprintCore, ai: Partial<BlueprintCore>): BlueprintCore {
  const layers = nonEmpty(ai.architecture?.layers, base.architecture.layers);
  return {
    overview: { ...base.overview, ...stripEmpty(ai.overview) },
    architecture: {
      ...base.architecture,
      ...stripEmpty(ai.architecture),
      layers,
      diagram: buildDiagram(layers),
    },
    workflows: nonEmpty(ai.workflows, base.workflows),
    dataGovernance: { ...base.dataGovernance, ...stripEmpty(ai.dataGovernance) },
    delivery: { ...base.delivery, ...stripEmpty(ai.delivery) },
  };
}

function stripEmpty<T extends object>(value: T | undefined): Partial<T> {
  return Object.fromEntries(
    Object.entries(value || {}).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.length > 0 : v !== undefined)),
  ) as Partial<T>;
}

const HIGHLIGHT_MAX = 300;

// Short excerpts of the specialist's other replies in saved chats about this solution.
export function chatHighlights(messages: StoredChatMessage[]): string[] {
  return messages
    .filter((m) => m.role === 'assistant' && m.intent !== 'consult' && m.content)
    .slice(-3)
    .map((m) => (m.content.length > HIGHLIGHT_MAX ? `${m.content.slice(0, HIGHLIGHT_MAX)}…` : m.content));
}

export function toSpecialistNote(
  result: ConsultResult,
  source: SpecialistNote['source'],
  highlights: string[],
  consultedOn: string,
): SpecialistNote {
  return {
    service: result.service,
    displayName: getSpecialist(result.service)?.displayName || result.service,
    fit: result.fit,
    source,
    summary: result.advice || result.reason,
    supports: result.supports || [],
    constraints: result.constraints || [],
    questions: result.questions,
    risks: result.risks,
    validation: result.validation,
    chatHighlights: highlights,
    consultedOn,
  };
}

// Rebuilds a consult result from a message stored by the consult route.
export function storedConsult(message: StoredChatMessage): ConsultResult | undefined {
  const consult = message.consult as Partial<ConsultResult> | undefined;
  return consult && typeof consult.service === 'string' ? (consult as ConsultResult) : undefined;
}

export function assembleBlueprint(
  state: SolutionState,
  core: BlueprintCore,
  notes: SpecialistNote[],
  meta: Pick<SolutionBlueprint, 'generatedOn' | 'mode' | 'model' | 'warning'>,
  details: BlueprintServiceDetail[] = [],
): SolutionBlueprint {
  const risks = unique([...core.overview.risks, ...notes.flatMap((n) => n.risks.slice(0, 2))]);
  return {
    ...meta,
    ...core,
    overview: { ...core.overview, risks },
    serviceMapping: buildServiceMapping(state, details),
    specialistNotes: notes,
  };
}

export function isBlueprintOutOfDate(state: SolutionState): boolean {
  return !!(state.blueprint && state.problemStatementUpdatedOn && state.problemStatementUpdatedOn > state.blueprint.generatedOn);
}
