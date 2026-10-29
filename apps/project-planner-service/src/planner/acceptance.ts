import { AcceptanceCriterion, DecisionRecord, OpenQuestion, SolutionBlueprint } from './types';

export const RULES_GROUP = 'Rules';

// A plan item a criterion may restate; the model cites it by key so the source can be checked.
export interface AcceptanceReference {
  key: string;
  label: string;
  text: string;
}

// A criterion before checking: its source is a reference key and it has no id yet.
export type AcceptanceDraft = Omit<AcceptanceCriterion, 'id'>;

const withoutFinalPeriod = (text: string) => text.trim().replace(/[.\s]+$/, '');

const numberedSteps = (steps: string[]) => steps.map((step, i) => `(${i + 1}) ${withoutFinalPeriod(step)}`).join('; ');

const quoted = (kind: string, text: string) => `${kind} "${text}"`;

export const criteriaGroups = (blueprint: SolutionBlueprint): string[] => [
  ...blueprint.workflows.map((w) => w.name),
  RULES_GROUP,
];

function numbered(criteria: AcceptanceDraft[], blueprint: SolutionBlueprint): AcceptanceCriterion[] {
  const order = criteriaGroups(blueprint);
  return [...criteria]
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
    .map((criterion, i) => ({ id: `AC-${i + 1}`, ...criterion }));
}

export function acceptanceReferences(
  blueprint: SolutionBlueprint,
  { decisions, questions }: { decisions: DecisionRecord[]; questions: OpenQuestion[] },
): AcceptanceReference[] {
  const items = (prefix: string, kind: string, values: string[]) =>
    values.map((text, i) => ({ key: `${prefix}:${i + 1}`, label: quoted(kind, text), text }));
  const { dataGovernance: d } = blueprint;
  return [
    ...blueprint.workflows.map((w, i) => ({
      key: `workflow:${i + 1}`,
      label: quoted('Workflow', w.name),
      text: `Actors: ${w.actors.join(', ') || 'not named'}. Steps: ${numberedSteps(w.steps)}`,
    })),
    ...decisions.map((r) => ({ key: `decision:${r.id}`, label: quoted('Decision', r.title), text: r.decision })),
    ...questions
      .filter((q) => q.status === 'answered' && q.answer)
      .map((q) => ({
        key: `question:${q.id}`,
        label: quoted('Answered question', q.question),
        text: `${q.question} Answer: ${q.answer}`,
      })),
    ...items('scope', 'Scope', blueprint.overview.scope),
    ...items('access', 'Access control', d.accessControl),
    ...items('retention', 'Retention', d.retention),
    ...items('privacy', 'Privacy', d.privacy),
    ...items('audit', 'Audit', d.audit),
    ...items('compliance', 'Compliance', d.compliance),
    ...items('nfr', 'Non-functional requirement', blueprint.delivery.nonFunctional),
  ];
}

export function ruleAcceptanceCriteria(
  blueprint: SolutionBlueprint,
  decisions: DecisionRecord[],
): AcceptanceCriterion[] {
  const workflows = blueprint.workflows
    .filter((w) => w.steps.length > 0)
    .map((w) => ({
      group: w.name,
      actor: w.actors.join(', ') || undefined,
      given: `the "${w.name}" workflow`,
      when: w.actors.length
        ? `${w.actors.join(' and ')} ${w.actors.length > 1 ? 'complete' : 'completes'} it`
        : 'the user completes it',
      then: numberedSteps(w.steps),
      source: quoted('Workflow', w.name),
    }));
  const rules = decisions.map((r) => ({ group: RULES_GROUP, then: r.decision, source: quoted('Decision', r.title) }));
  return numbered([...workflows, ...rules], blueprint);
}

export function checkedAcceptanceCriteria(
  drafts: AcceptanceDraft[],
  blueprint: SolutionBlueprint,
  references: AcceptanceReference[],
): AcceptanceCriterion[] {
  const labels = new Map(references.map((r) => [r.key, r.label]));
  const workflowNames = new Set(blueprint.workflows.map((w) => w.name));
  const kept = drafts
    .filter((draft) => labels.has(draft.source) && draft.then.trim())
    .map((draft) => ({
      ...draft,
      group: workflowNames.has(draft.group) ? draft.group : RULES_GROUP,
      source: labels.get(draft.source),
    }));
  return numbered(kept, blueprint);
}
