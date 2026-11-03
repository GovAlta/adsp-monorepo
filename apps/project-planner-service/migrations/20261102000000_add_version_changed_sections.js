/* eslint-disable no-undef */
const { createHash } = require('crypto');

// Copies of the hashing/diffing logic in src/planner/versioning.ts; a spec keeps them in step.
const canonical = function (value) {
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

const hash = function (value) {
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
};

const withoutVolatileTimestamps = function (content) {
  const withoutAnalysis = content.state.analysis
    ? { ...content, state: { ...content.state, analysis: { ...content.state.analysis, analyzedOn: undefined } } }
    : content;
  return withoutAnalysis.state.blueprint
    ? {
        ...withoutAnalysis,
        state: { ...withoutAnalysis.state, blueprint: { ...withoutAnalysis.state.blueprint, generatedOn: undefined } },
      }
    : withoutAnalysis;
};

const contentHash = function (content) {
  return hash(withoutVolatileTimestamps(content));
};

const omitConsultedOn = function (note) {
  const { consultedOn: _consultedOn, ...rest } = note;
  return rest;
};

const omitReview = function (component) {
  const { review: _review, ...rest } = component;
  return rest;
};

const reviewedComponents = function (c) {
  return c.state.blueprint?.components
    ?.filter(({ review }) => review && review !== 'not-reviewed')
    .map(({ order, name, review }) => ({ order, name, review }));
};

const SECTIONS = {
  Title: (c) => c.name,
  Description: (c) => c.description,
  Scenario: (c) => c.scenario,
  Status: (c) => c.status,
  'Problem statement': (c) => c.state.problemStatement,
  Analysis: (c) => ({
    analysis: withoutVolatileTimestamps(c).state.analysis,
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

const normalize = function (value) {
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

const isEmpty = function (value) {
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

const sectionHashes = function (content) {
  const hashes = {};
  for (const [name, select] of Object.entries(SECTIONS)) {
    const value = canonical(normalize(select(content)));
    if (!isEmpty(value)) {
      hashes[name] = hash(value);
    }
  }
  return hashes;
};

const changedSections = function (previous, current) {
  const before = sectionHashes(previous);
  const after = sectionHashes(current);
  const changed = Object.keys(SECTIONS).filter((name) => before[name] !== after[name]);
  if (changed.length === 0 && contentHash(previous) !== contentHash(current)) {
    return ['Other details'];
  }
  return changed;
};

exports.contentHash = contentHash;
exports.changedSections = changedSections;

exports.up = async function (knex) {
  await knex.schema.alterTable('solution_versions', function (table) {
    table.jsonb('changedSections');
  });

  const tenants = await knex('solution_versions').distinct('tenant', 'solutionId');
  for (const { tenant, solutionId } of tenants) {
    const versions = await knex('solution_versions')
      .where({ tenant, solutionId })
      .orderBy('number', 'asc')
      .select('number', 'content');
    let previous;
    for (const version of versions) {
      const sections = previous ? changedSections(previous.content, version.content) : [];
      await knex('solution_versions')
        .where({ tenant, solutionId, number: version.number })
        .update({ changedSections: JSON.stringify(sections) });
      previous = version;
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('solution_versions', function (table) {
    table.dropColumn('changedSections');
  });
};
