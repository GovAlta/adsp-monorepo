import { createHash } from 'crypto';
import { BlueprintComponent, Solution, SpecialistNote } from './types';

export type VersionBump = 'major' | 'minor' | 'none';

type VersionableSolution = Pick<Solution, 'name' | 'state'>;

const omitConsultedOn = (note: SpecialistNote): Omit<SpecialistNote, 'consultedOn'> => {
  const { consultedOn: _consultedOn, ...rest } = note;
  return rest;
};

const omitReview = (component: BlueprintComponent): Omit<BlueprintComponent, 'review'> => {
  const { review: _review, ...rest } = component;
  return rest;
};

// Only reviewed components, so a blueprint where nothing is reviewed yet does not bump.
const reviewedComponents = (s: VersionableSolution) =>
  s.state.blueprint?.components
    ?.filter(({ review }) => review && review !== 'not-reviewed')
    .map(({ order, name, review }) => ({ order, name, review }));

const MINOR_SECTIONS: Record<string, (solution: VersionableSolution) => unknown> = {
  Title: (s) => s.name,
  'Problem statement': (s) => s.state.problemStatement,
  Concepts: (s) => s.state.concepts,
  Decisions: (s) => s.state.decisions,
  'Pattern matches': (s) => s.state.patternMatches,
  Hypotheses: (s) => s.state.hypotheses,
  'Questions and answers': (s) => s.state.questions,
  'Next steps': (s) => s.state.nextSteps,
  Confidence: (s) => s.state.confidence,
  'Component review': reviewedComponents,
};

const MAJOR_SECTIONS: Record<string, (solution: VersionableSolution) => unknown> = {
  Overview: (s) => s.state.blueprint?.overview,
  Architecture: (s) => s.state.blueprint?.architecture,
  'Service mapping': (s) => s.state.blueprint?.serviceMapping,
  'Not covered by ADSP': (s) => {
    const items = s.state.blueprint?.notCoveredByAdsp;
    return items === undefined ? undefined : { items };
  },
  'Components to set up': (s) => s.state.blueprint?.components?.map(omitReview),
  'Specialist notes': (s) => s.state.blueprint?.specialistNotes?.map(omitConsultedOn),
  Workflows: (s) => s.state.blueprint?.workflows,
  'Data & governance': (s) => s.state.blueprint?.dataGovernance,
  Delivery: (s) => s.state.blueprint?.delivery,
};

const SECTIONS = { ...MINOR_SECTIONS, ...MAJOR_SECTIONS };
const SECTION_ORDER = Object.keys(SECTIONS);
const MAJOR_SECTION_NAMES = new Set(Object.keys(MAJOR_SECTIONS));

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

const hashSection = (value: unknown): string =>
  createHash('sha256')
    .update(JSON.stringify(normalize(value)))
    .digest('hex');

const isEmpty = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
};

export function sectionHashes(solution: VersionableSolution): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const [name, select] of Object.entries(SECTIONS)) {
    const value = select(solution);
    if (!isEmpty(value)) {
      hashes[name] = hashSection(value);
    }
  }
  return hashes;
}

const sectionRank = (name: string): number => {
  const index = SECTION_ORDER.indexOf(name);
  return index === -1 ? SECTION_ORDER.length : index;
};

// Sorted because stored hashes are jsonb, which does not keep key order.
export function changedSections(previous: Record<string, string>, current: Record<string, string>): string[] {
  const names = new Set([...Object.keys(previous), ...Object.keys(current)]);
  return [...names].filter((name) => previous[name] !== current[name]).sort((a, b) => sectionRank(a) - sectionRank(b));
}

export function classifyBump(changed: string[]): VersionBump {
  if (changed.length === 0) {
    return 'none';
  }
  return changed.some((name) => MAJOR_SECTION_NAMES.has(name)) ? 'major' : 'minor';
}

export function nextVersion(current: string, bump: Exclude<VersionBump, 'none'>): string {
  const [majorPart, minorPart] = current.split('.');
  const major = Number(majorPart) || 1;
  const minor = Number(minorPart) || 0;
  return bump === 'major' ? `${major + 1}.0` : `${major}.${minor + 1}`;
}
