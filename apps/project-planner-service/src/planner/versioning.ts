import { createHash } from 'crypto';
import { BlueprintComponent, Solution, SpecialistChat, SpecialistNote } from './types';

export interface VersionChat extends Pick<SpecialistChat, 'id' | 'service' | 'title' | 'createdByName' | 'messages'> {
  createdOn: string;
  updatedOn: string;
}

// Everything a saved version keeps; also what the migration backfills, so keep the two in step.
export interface VersionContent extends Pick<Solution, 'name' | 'description' | 'scenario' | 'status' | 'state'> {
  specialistChats: VersionChat[];
}

export function versionContent(
  solution: Pick<Solution, 'name' | 'description' | 'scenario' | 'status' | 'state'>,
  chats: SpecialistChat[],
): VersionContent {
  const specialistChats = chats
    .map(({ id, service, title, createdByName, createdOn, updatedOn, messages }) => ({
      id,
      service,
      title,
      createdByName,
      createdOn: new Date(createdOn).toISOString(),
      updatedOn: new Date(updatedOn).toISOString(),
      messages,
    }))
    .sort((a, b) => a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id));
  const { name, description, scenario, status, state } = solution;
  return { name, description, scenario, status, state, specialistChats };
}

// Sorted keys and no nulls, so a copy read back from jsonb hashes the same as the original.
const canonical = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonical(item) ?? null);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== null && value[key] !== undefined)
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
};

const hash = (value: unknown): string =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');

export const contentHash = (content: VersionContent): string => hash(content);

const omitConsultedOn = (note: SpecialistNote): Omit<SpecialistNote, 'consultedOn'> => {
  const { consultedOn: _consultedOn, ...rest } = note;
  return rest;
};

const omitReview = (component: BlueprintComponent): Omit<BlueprintComponent, 'review'> => {
  const { review: _review, ...rest } = component;
  return rest;
};

const reviewedComponents = (c: VersionContent) =>
  c.state.blueprint?.components
    ?.filter(({ review }) => review && review !== 'not-reviewed')
    .map(({ order, name, review }) => ({ order, name, review }));

const SECTIONS: Record<string, (content: VersionContent) => unknown> = {
  Title: (c) => c.name,
  Description: (c) => c.description,
  Scenario: (c) => c.scenario,
  Status: (c) => c.status,
  'Problem statement': (c) => c.state.problemStatement,
  Analysis: (c) => ({
    analysis: c.state.analysis,
    patternMatches: c.state.patternMatches,
    confidence: c.state.confidence,
  }),
  'Discovery conversation': (c) => c.state.discovery,
  Concepts: (c) => c.state.concepts,
  Decisions: (c) => c.state.decisions,
  Hypotheses: (c) => c.state.hypotheses?.slice(0, 1),
  'Questions and answers': (c) => c.state.questions,
  'Next steps': (c) => c.state.nextSteps,
  'Planner conversation': (c) => c.state.conversation,
  'Specialist consultations': (c) => ({ specialists: c.state.specialists, specialistChats: c.specialistChats }),
  'Component review': reviewedComponents,
  Overview: (c) => c.state.blueprint?.overview,
  Architecture: (c) => c.state.blueprint?.architecture,
  'Service mapping': (c) => c.state.blueprint?.serviceMapping,
  'Not covered by ADSP': (c) => {
    const items = c.state.blueprint?.notCoveredByAdsp;
    return items === undefined ? undefined : { items };
  },
  'Components to set up': (c) => c.state.blueprint?.components?.map(omitReview),
  'Specialist notes': (c) => c.state.blueprint?.specialistNotes?.map(omitConsultedOn),
  Workflows: (c) => c.state.blueprint?.workflows,
  'Data & governance': (c) => c.state.blueprint?.dataGovernance,
  Delivery: (c) => c.state.blueprint?.delivery,
  'Acceptance criteria': (c) => c.state.blueprint?.acceptance,
};

const normalize = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, normalize(v)]));
  }
  return value;
};

const isEmpty = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'string') {
    return value === '';
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
};

const sectionHashes = (content: VersionContent): Record<string, string> => {
  const hashes: Record<string, string> = {};
  for (const [name, select] of Object.entries(SECTIONS)) {
    const value = canonical(normalize(select(content)));
    if (!isEmpty(value)) {
      hashes[name] = hash(value);
    }
  }
  return hashes;
};

// Other details covers changes outside the named sections, such as whitespace or timestamps.
export function changedSections(previous: VersionContent, current: VersionContent): string[] {
  const before = sectionHashes(previous);
  const after = sectionHashes(current);
  const changed = Object.keys(SECTIONS).filter((name) => before[name] !== after[name]);
  if (changed.length === 0 && contentHash(previous) !== contentHash(current)) {
    return ['Other details'];
  }
  return changed;
}
