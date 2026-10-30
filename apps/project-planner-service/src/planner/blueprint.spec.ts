import { ConsultResult } from './analysis';
import {
  assembleBlueprint,
  BlueprintCore,
  buildDiagram,
  buildNotCoveredByAdsp,
  buildRuleBlueprint,
  buildServiceMapping,
  chatHighlights,
  mergeBlueprintCore,
  recommendedServices,
  storedConsult,
  toSpecialistNote,
} from './blueprint';
import { buildComponents } from './components';
import { getSpecialist } from './specialists';
import {
  BlueprintLayer,
  BusinessConcept,
  BusinessPattern,
  SolutionState,
  SpecialistNote,
  StoredChatMessage,
} from './types';

const concept = (type: BusinessConcept['type'], name: string, description?: string): BusinessConcept => ({
  id: `${type}-${name}`,
  type,
  name,
  description,
  source: 'extracted',
});

const grantState = (): SolutionState => ({
  problemStatement: 'Residents apply for grants and officers review each application.',
  concepts: [
    concept('actor', 'Grant officer'),
    concept('actor', 'Applicant'),
    concept('goal', 'Faster decisions'),
    concept('outcome', 'Approved grant'),
    concept('activity', 'Review application'),
    concept('document', 'Grant application'),
    concept('external-system', 'Finance system'),
    concept('business-rule', 'Limit is $50,000'),
    concept('workflow', 'Grant review', 'Officer reviews the file'),
  ],
  decisions: [],
  questions: [
    { id: 'q-1', question: 'Who approves large grants?', status: 'open' },
    { id: 'q-2', question: 'Is there a budget?', status: 'answered' },
  ] as SolutionState['questions'],
  patternMatches: [],
  hypotheses: [
    {
      id: 'h-1',
      title: 'Grant case workflow',
      patternId: 'case-management',
      confidence: 'high',
      rationale: 'Applications are reviewed as cases.',
      recommendations: [
        { service: 'notification-service', reason: 'Tell applicants', order: 3 },
        { service: 'form-service', reason: 'Collect applications', order: 1 },
        { service: 'file-service', reason: 'Store attachments', order: 2 },
        { service: 'push-service', reason: 'Live updates', order: 4 },
        { service: 'value-service', reason: 'Track metrics', order: 5 },
      ],
      assumptions: [],
      unknowns: ['Approval limits'],
    },
  ],
  specialists: [],
  nextSteps: [],
});

const bareState = (): SolutionState => ({
  ...grantState(),
  problemStatement: '',
  concepts: [],
  questions: [],
  hypotheses: [],
});

const pattern = {
  id: 'case-management',
  commonFeatures: ['Case intake', 'Assignment', 'Status tracking', 'Notes', 'Extra'],
} as unknown as BusinessPattern;

const layers: BlueprintLayer[] = [
  { name: 'Experience', description: 'Web app', components: ['Officer view'] },
  { name: 'ADSP services', description: 'Services', components: ['form-service', 'file-service'] },
];

const consultResult = (overrides: Partial<ConsultResult> = {}): ConsultResult => ({
  service: 'form-service',
  fit: 'recommended',
  reason: 'Applications need an intake form.',
  questions: ['Which fields are mandatory?'],
  dependencies: [],
  risks: ['Duplicate submissions', 'Draft expiry', 'Large uploads'],
  ...overrides,
});

describe('recommendedServices', () => {
  it('sorts the first hypothesis recommendations by order', () => {
    const result = recommendedServices(grantState()).map((r) => r.service);

    expect(result).toEqual(['form-service', 'file-service', 'notification-service', 'push-service', 'value-service']);
  });

  it('returns an empty list when there are no hypotheses', () => {
    expect(recommendedServices(bareState())).toEqual([]);
  });
});

describe('buildDiagram', () => {
  it('joins the layers with a downward arrow between them', () => {
    const diagram = buildDiagram(layers).split('\n');

    expect(diagram.filter((l) => l.trim() === 'v')).toHaveLength(1);
  });

  it.each(['Experience: Officer view', 'ADSP services: form-service, file-service'])('draws a row for "%s"', (row) => {
    expect(buildDiagram(layers)).toContain(row);
  });

  it('closes a single-layer diagram without an arrow', () => {
    const diagram = buildDiagram([layers[0]]).split('\n');

    expect(diagram).toHaveLength(3);
  });

  it('draws every border at a fixed width', () => {
    const [border] = buildDiagram([{ name: 'A', description: '', components: ['b'] }]).split('\n');

    expect(border).toHaveLength(78);
  });

  it('wraps a long layer onto an indented continuation row', () => {
    const long: BlueprintLayer = {
      name: 'Experience',
      description: '',
      components: ['Officer view '.repeat(8).trim()],
    };

    const rows = buildDiagram([long]).split('\n');

    expect(rows[2]).toMatch(/^\| {3}\S/);
  });

  it('keeps wrapped rows the same width as the border', () => {
    const long: BlueprintLayer = {
      name: 'Experience',
      description: '',
      components: ['Officer view '.repeat(8).trim()],
    };

    const rows = buildDiagram([long]).split('\n');

    expect(rows.map((r) => r.length)).toEqual([78, 78, 78, 78]);
  });
});

describe('buildServiceMapping', () => {
  it('returns one role per recommended service in order', () => {
    const result = buildServiceMapping(grantState()).map((r) => r.service);

    expect(result).toEqual(['form-service', 'file-service', 'notification-service', 'push-service', 'value-service']);
  });

  it('uses the specialist display name and purpose by default', () => {
    const [first] = buildServiceMapping(grantState());
    const specialist = getSpecialist('form-service');

    expect(first).toMatchObject({
      displayName: specialist.displayName,
      role: specialist.purpose,
      reason: 'Collect applications',
    });
  });

  it('leaves capabilities empty when none were supplied', () => {
    const [first] = buildServiceMapping(grantState());

    expect(first.capabilities).toEqual([]);
  });

  it('prefers the role and capabilities supplied for the service', () => {
    const [first] = buildServiceMapping(grantState(), [
      { service: 'form-service', role: 'Collects grant applications', capabilities: ['Draft saving'] },
    ]);

    expect(first).toMatchObject({ role: 'Collects grant applications', capabilities: ['Draft saving'] });
  });

  it('falls back to the recommendation reason and service id for an unknown specialist', () => {
    const state = bareState();
    state.hypotheses = [
      {
        ...grantState().hypotheses[0],
        recommendations: [{ service: 'custom-service', reason: 'Bespoke need', order: 1 }],
      },
    ];

    const [role] = buildServiceMapping(state);

    expect(role).toMatchObject({
      displayName: 'custom-service',
      role: 'Bespoke need',
      dependsOn: [],
      capabilities: [],
    });
  });
});

describe('buildRuleBlueprint', () => {
  it('titles the overview with the hypothesis title', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.title).toBe('Grant case workflow');
  });

  it('uses the hypothesis rationale as the summary', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.summary).toBe('Applications are reviewed as cases.');
  });

  it('collects goals and outcomes as objectives', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.objectives).toEqual([
      'Faster decisions',
      'Approved grant',
    ]);
  });

  it('limits scope to the first eight pattern features', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.scope).toEqual(pattern.commonFeatures);
  });

  it('falls back to activities for scope when there is no pattern', () => {
    expect(buildRuleBlueprint(grantState()).overview.scope).toEqual(['Review application']);
  });

  it('lists actors as stakeholders', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.stakeholders).toEqual(['Grant officer', 'Applicant']);
  });

  it('lists each actor as a role with the app role and product type left open', () => {
    expect(buildRuleBlueprint(grantState(), pattern).overview.roles).toEqual([
      { actor: 'Grant officer', appRole: '', productType: '' },
      { actor: 'Applicant', appRole: '', productType: '' },
    ]);
  });

  it('includes hypothesis unknowns and a specialist risk in the overview risks', () => {
    const { risks } = buildRuleBlueprint(grantState(), pattern).overview;

    expect(risks).toEqual(expect.arrayContaining(['Approval limits', getSpecialist('form-service').risks[0]]));
  });

  it('builds five layers', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.layers.map((l) => l.name)).toEqual([
      'Experience',
      'ADSP services',
      'Events & notification',
      'Data & files',
      'Identity & access',
    ]);
  });

  it('creates an experience view for each actor', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.layers[0].components).toEqual([
      'Grant officer view',
      'Applicant view',
    ]);
  });

  it('includes notification and push in the events layer when recommended', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.layers[2].components).toEqual([
      'Event service',
      'Notification service',
      'Push service',
    ]);
  });

  it('lists data stores for the recommended form, file and value services', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.layers[3].components).toEqual([
      'Form submissions',
      'Files and documents',
      'Metrics values',
      'Service-owned records',
    ]);
  });

  it('summarises the number of recommended services', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.summary).toContain('5 ADSP service(s)');
  });

  it('lists external systems as integrations', () => {
    expect(buildRuleBlueprint(grantState(), pattern).architecture.integrations).toEqual(['Finance system']);
  });

  it('builds the diagram from the layers', () => {
    const { architecture } = buildRuleBlueprint(grantState(), pattern);

    expect(architecture.diagram).toBe(buildDiagram(architecture.layers));
  });

  it('starts workflows with the core workflow listing each service step', () => {
    const [core] = buildRuleBlueprint(grantState(), pattern).workflows;

    expect(core).toMatchObject({ name: 'Core workflow — Grant case workflow' });
  });

  it('orders the core workflow steps by service order', () => {
    const [core] = buildRuleBlueprint(grantState(), pattern).workflows;

    expect(core.steps[0]).toBe('1. form-service: Collect applications');
  });

  it('adds a workflow for each workflow concept using pattern features', () => {
    const workflow = buildRuleBlueprint(grantState(), pattern).workflows[1];

    expect(workflow).toMatchObject({
      name: 'Grant review',
      steps: ['Case intake', 'Assignment', 'Status tracking', 'Notes', 'Officer reviews the file'],
    });
  });

  it('collects document and outcome concepts as data entities', () => {
    expect(buildRuleBlueprint(grantState(), pattern).dataGovernance.dataEntities).toEqual([
      'Approved grant',
      'Grant application',
    ]);
  });

  it('defines access control per actor', () => {
    expect(buildRuleBlueprint(grantState(), pattern).dataGovernance.accessControl[0]).toBe(
      'Grant officer: define view and edit rights',
    );
  });

  it('includes business rules in compliance', () => {
    expect(buildRuleBlueprint(grantState(), pattern).dataGovernance.compliance).toContain('Limit is $50,000');
  });

  it('lists only open questions as delivery open questions', () => {
    expect(buildRuleBlueprint(grantState(), pattern).delivery.openQuestions).toEqual(['Who approves large grants?']);
  });

  it('sets up the first two services in the foundation phase', () => {
    const foundation = buildRuleBlueprint(grantState(), pattern).delivery.phases[1];

    expect(foundation.items).toEqual([
      'Create the tenant configuration and roles',
      'Set up form-service',
      'Set up file-service',
    ]);
  });

  describe('without analysis', () => {
    it('titles the overview as a proposed solution', () => {
      expect(buildRuleBlueprint(bareState()).overview.title).toBe('Proposed solution');
    });

    it('uses the problem statement as the summary', () => {
      const state = { ...bareState(), problemStatement: 'Track grants.' };

      expect(buildRuleBlueprint(state).overview.summary).toBe('Track grants.');
    });

    it('has no objectives when there are no goals and the problem statement is empty', () => {
      expect(buildRuleBlueprint(bareState()).overview.objectives).toEqual([]);
    });

    it('defaults the experience layer to a web application', () => {
      expect(buildRuleBlueprint(bareState()).architecture.layers[0].components).toEqual(['Web application']);
    });

    it('notes in the services layer that none are recommended', () => {
      expect(buildRuleBlueprint(bareState()).architecture.layers[1].components).toEqual(['(none recommended yet)']);
    });

    it('notes in the architecture summary that no services are recommended', () => {
      expect(buildRuleBlueprint(bareState()).architecture.summary).toContain('No services recommended yet');
    });

    it('omits the core workflow when it has no steps', () => {
      expect(buildRuleBlueprint(bareState()).workflows).toEqual([]);
    });

    it('lists only workflow concepts that have steps when there is no hypothesis', () => {
      const state = {
        ...bareState(),
        concepts: [concept('workflow', 'Intake', 'Applicant submits the form'), concept('workflow', 'Empty')],
      };

      expect(buildRuleBlueprint(state).workflows.map((w) => w.name)).toEqual(['Intake']);
    });

    it('defaults access control when there are no actors', () => {
      expect(buildRuleBlueprint(bareState()).dataGovernance.accessControl).toEqual(['Define roles per user group']);
    });

    it('defaults success measures', () => {
      expect(buildRuleBlueprint(bareState()).overview.successMeasures).toEqual([
        'Agree measurable success criteria with the business owner',
      ]);
    });

    it('defaults data entities', () => {
      expect(buildRuleBlueprint(bareState()).dataGovernance.dataEntities).toEqual([
        'Define the main records the solution creates',
      ]);
    });
  });
});

describe('mergeBlueprintCore', () => {
  const base = (): BlueprintCore => buildRuleBlueprint(grantState(), pattern);

  it('keeps the base when the ai supplied nothing', () => {
    expect(mergeBlueprintCore(base(), {})).toEqual(base());
  });

  it('overrides overview fields the ai supplied', () => {
    const result = mergeBlueprintCore(base(), { overview: { ...base().overview, summary: 'AI summary' } });

    expect(result.overview.summary).toBe('AI summary');
  });

  it('keeps base overview lists when the ai lists are empty', () => {
    const result = mergeBlueprintCore(base(), { overview: { ...base().overview, objectives: [] } });

    expect(result.overview.objectives).toEqual(base().overview.objectives);
  });

  it('keeps the base string when the ai string is empty', () => {
    const result = mergeBlueprintCore(base(), { overview: { ...base().overview, summary: '' } });

    expect(result.overview.summary).toBe('Applications are reviewed as cases.');
  });

  it('keeps ai fields that are defined but neither strings nor arrays', () => {
    const odd = { ...base().overview, title: 5 } as unknown as BlueprintCore['overview'];

    expect(mergeBlueprintCore(base(), { overview: odd }).overview.title).toBe(5);
  });

  it('ignores undefined ai fields', () => {
    const result = mergeBlueprintCore(base(), {
      overview: { ...base().overview, title: undefined } as unknown as BlueprintCore['overview'],
    });

    expect(result.overview.title).toBe('Grant case workflow');
  });

  it('uses the ai layers and rebuilds the diagram from them', () => {
    const result = mergeBlueprintCore(base(), { architecture: { ...base().architecture, layers } });

    expect(result.architecture.diagram).toBe(buildDiagram(layers));
  });

  it('keeps the base layers when the ai has none', () => {
    const result = mergeBlueprintCore(base(), { architecture: { ...base().architecture, layers: [] } });

    expect(result.architecture.layers).toEqual(base().architecture.layers);
  });

  it('uses ai workflows when supplied', () => {
    const workflows = [{ name: 'Review', actors: ['Grant officer'], steps: ['Open file'] }];

    expect(mergeBlueprintCore(base(), { workflows }).workflows).toEqual(workflows);
  });

  it('keeps base workflows when the ai has none', () => {
    expect(mergeBlueprintCore(base(), { workflows: [] }).workflows).toEqual(base().workflows);
  });

  it('overrides data governance sections the ai supplied', () => {
    const result = mergeBlueprintCore(base(), { dataGovernance: { ...base().dataGovernance, retention: ['7 years'] } });

    expect(result.dataGovernance.retention).toEqual(['7 years']);
  });

  it('overrides delivery sections the ai supplied', () => {
    const result = mergeBlueprintCore(base(), { delivery: { ...base().delivery, nonFunctional: ['99.9% uptime'] } });

    expect(result.delivery.nonFunctional).toEqual(['99.9% uptime']);
  });
});

describe('chatHighlights', () => {
  const message = (overrides: Partial<StoredChatMessage>): StoredChatMessage => ({
    role: 'assistant',
    content: 'Use draft saving.',
    at: '2026-03-01T10:00:00.000Z',
    ...overrides,
  });

  it('ignores user messages', () => {
    expect(chatHighlights([message({ role: 'user' })])).toEqual([]);
  });

  it('ignores consult messages', () => {
    expect(chatHighlights([message({ intent: 'consult' })])).toEqual([]);
  });

  it('ignores assistant messages without content', () => {
    expect(chatHighlights([message({ content: '' })])).toEqual([]);
  });

  it('keeps only the last three assistant replies', () => {
    const messages = ['one', 'two', 'three', 'four'].map((content) => message({ content }));

    expect(chatHighlights(messages)).toEqual(['two', 'three', 'four']);
  });

  it('truncates long replies with an ellipsis', () => {
    const [highlight] = chatHighlights([message({ content: 'a'.repeat(400) })]);

    expect(highlight).toBe(`${'a'.repeat(300)}…`);
  });

  it('keeps replies at the limit unchanged', () => {
    const [highlight] = chatHighlights([message({ content: 'a'.repeat(300) })]);

    expect(highlight).toHaveLength(300);
  });
});

describe('toSpecialistNote', () => {
  const on = '2026-03-01T10:00:00.000Z';

  it('summarises with the advice when present', () => {
    const note = toSpecialistNote(consultResult({ advice: 'Use one intake form.' }), 'ai', [], on);

    expect(note.summary).toBe('Use one intake form.');
  });

  it('summarises with the reason when there is no advice', () => {
    const note = toSpecialistNote(consultResult(), 'rules', [], on);

    expect(note.summary).toBe('Applications need an intake form.');
  });

  it('uses the specialist display name', () => {
    const note = toSpecialistNote(consultResult(), 'rules', [], on);

    expect(note.displayName).toBe(getSpecialist('form-service').displayName);
  });

  it('falls back to the service id for an unknown specialist', () => {
    const note = toSpecialistNote(consultResult({ service: 'custom-service' }), 'rules', [], on);

    expect(note.displayName).toBe('custom-service');
  });

  it('defaults supports and constraints to empty lists', () => {
    const note = toSpecialistNote(consultResult(), 'rules', [], on);

    expect(note).toMatchObject({ supports: [], constraints: [] });
  });

  it('uses an empty highlight list when none are supplied', () => {
    expect(toSpecialistNote(consultResult(), 'rules', [], on).chatHighlights).toEqual([]);
  });

  it('carries over supports, constraints, validation, source, highlights and date', () => {
    const validation = { verdict: 'sound' as const, findings: [] };

    const note = toSpecialistNote(
      consultResult({ supports: ['Drafts'], constraints: ['One form'], validation }),
      'saved-consultation',
      ['Earlier'],
      on,
    );

    expect(note).toMatchObject({
      supports: ['Drafts'],
      constraints: ['One form'],
      validation,
      source: 'saved-consultation',
      chatHighlights: ['Earlier'],
      consultedOn: on,
    });
  });
});

describe('storedConsult', () => {
  const message = (consult?: Record<string, unknown>): StoredChatMessage => ({
    role: 'assistant',
    content: 'x',
    at: '2026-03-01T10:00:00.000Z',
    consult,
  });

  it('returns the consult result stored on the message', () => {
    const consult = { ...consultResult() } as Record<string, unknown>;

    expect(storedConsult(message(consult))).toBe(consult);
  });

  it('returns undefined when the message has no consult', () => {
    expect(storedConsult(message())).toBeUndefined();
  });

  it('returns undefined when the stored consult has no service', () => {
    expect(storedConsult(message({ fit: 'recommended' }))).toBeUndefined();
  });
});

describe('assembleBlueprint', () => {
  const meta = { generatedOn: '2026-03-01T10:00:00.000Z', mode: 'rules' as const };
  const note = (risks: string[]): SpecialistNote =>
    toSpecialistNote(consultResult({ risks }), 'rules', [], meta.generatedOn);

  it('includes the metadata and the core sections', () => {
    const core = buildRuleBlueprint(grantState(), pattern);

    const result = assembleBlueprint(grantState(), core, [], { ...meta, warning: 'Fell back' });

    expect(result).toMatchObject({
      generatedOn: meta.generatedOn,
      mode: 'rules',
      warning: 'Fell back',
      workflows: core.workflows,
    });
  });

  it('adds up to two risks from each specialist note without duplicates', () => {
    const core = buildRuleBlueprint(grantState(), pattern);

    const result = assembleBlueprint(
      grantState(),
      core,
      [note(['Duplicate submissions', 'Draft expiry', 'Large uploads']), note(['Draft expiry'])],
      meta,
    );

    expect(result.overview.risks.filter((r) => r === 'Draft expiry')).toHaveLength(1);
  });

  it('leaves out specialist risks beyond the first two', () => {
    const core = buildRuleBlueprint(grantState(), pattern);

    const result = assembleBlueprint(
      grantState(),
      core,
      [note(['Duplicate submissions', 'Draft expiry', 'Large uploads'])],
      meta,
    );

    expect(result.overview.risks).not.toContain('Large uploads');
  });

  it('maps the recommended services using the supplied details', () => {
    const core = buildRuleBlueprint(grantState(), pattern);

    const result = assembleBlueprint(grantState(), core, [], meta, [{ service: 'form-service', role: 'Intake' }]);

    expect(result.serviceMapping[0].role).toBe('Intake');
  });

  it('attaches the specialist notes', () => {
    const notes = [note([])];

    expect(assembleBlueprint(grantState(), buildRuleBlueprint(grantState()), notes, meta).specialistNotes).toBe(notes);
  });

  it('builds notCoveredByAdsp from the matched patterns and ai items', () => {
    const state = { ...grantState(), problemStatement: 'Applicants pay an application fee.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No service',
          suggestedApproach: 'Build it',
          keywords: ['fee'],
        },
      ],
    } as BusinessPattern;
    const aiItems = [
      { requirement: 'Weather forecast reminder', reason: 'No weather data', suggestedApproach: 'Use an external API' },
    ];

    const result = assembleBlueprint(
      state,
      buildRuleBlueprint(state, patternWithGaps),
      [],
      meta,
      [],
      [patternWithGaps],
      aiItems,
    );

    expect(result.notCoveredByAdsp).toEqual([
      { requirement: 'Fee or payment processing', reason: 'No service', suggestedApproach: 'Build it' },
      aiItems[0],
    ]);
  });

  it('attaches the components', () => {
    const components = buildComponents(grantState());

    expect(
      assembleBlueprint(grantState(), buildRuleBlueprint(grantState()), [], meta, [], [], [], components).components,
    ).toBe(components);
  });
});

describe('buildNotCoveredByAdsp', () => {
  const serviceMapping = buildServiceMapping(grantState());
  const state = grantState();

  it('includes a pattern item with no keywords unconditionally', () => {
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [{ requirement: 'Payments', reason: 'No service', suggestedApproach: 'Build it' }],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(state, [patternWithGaps], [], serviceMapping)).toEqual([
      { requirement: 'Payments', reason: 'No service', suggestedApproach: 'Build it' },
    ]);
  });

  it('includes a pattern item with keywords when one appears in the problem statement', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay a fee to submit their application.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it', keywords: ['fee'] },
      ],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(relevantState, [patternWithGaps], [], serviceMapping)).toEqual([
      { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it' },
    ]);
  });

  it('omits a pattern item with keywords when none appear anywhere in the solution', () => {
    const irrelevantState = { ...state, problemStatement: 'Seniors get free help shovelling snow.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it', keywords: ['fee'] },
      ],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(irrelevantState, [patternWithGaps], [], serviceMapping)).toEqual([]);
  });

  it('does not match a keyword inside an unrelated word', () => {
    const feedbackState = { ...state, problemStatement: 'Staff collect feedback from applicants.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it', keywords: ['fee'] },
      ],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(feedbackState, [patternWithGaps], [], serviceMapping)).toEqual([]);
  });

  it('collects items from every matched pattern, not just the first', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay a fee and undergo a background check.' };
    const patternA = {
      ...pattern,
      id: 'a',
      unsupportedCapabilities: [
        { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it', keywords: ['fee'] },
      ],
    } as BusinessPattern;
    const patternB = {
      ...pattern,
      id: 'b',
      unsupportedCapabilities: [
        {
          requirement: 'Background check',
          reason: 'No service',
          suggestedApproach: 'Build it',
          keywords: ['background check'],
        },
      ],
    } as BusinessPattern;

    const result = buildNotCoveredByAdsp(relevantState, [patternA, patternB], [], serviceMapping);

    expect(result.map((r) => r.requirement)).toEqual(['Fee payment', 'Background check']);
  });

  it('removes a duplicate item that two matched patterns both contribute', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay a fee.' };
    const item = { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it', keywords: ['fee'] };
    const patternA = { ...pattern, id: 'a', unsupportedCapabilities: [item] } as BusinessPattern;
    const patternB = {
      ...pattern,
      id: 'b',
      unsupportedCapabilities: [{ ...item, requirement: 'fee payment' }],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(relevantState, [patternA, patternB], [], serviceMapping)).toHaveLength(1);
  });

  it('merges items from different patterns that share a category into one canonical row', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay an application fee and a booking fee.' };
    const patternA = {
      ...pattern,
      id: 'a',
      unsupportedCapabilities: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts or reconciles payments.',
          suggestedApproach: 'Build it',
          keywords: ['application fee'],
          category: 'payment-collection',
          feeType: 'application',
          recordType: 'case',
        },
      ],
    } as BusinessPattern;
    const patternB = {
      ...pattern,
      id: 'b',
      unsupportedCapabilities: [
        {
          requirement: 'Advance payment at time of booking',
          reason: 'No ADSP service accepts or reconciles payments.',
          suggestedApproach: 'Build it',
          keywords: ['booking fee'],
          category: 'payment-collection',
          feeType: 'booking',
          recordType: 'booking',
        },
      ],
    } as BusinessPattern;

    const result = buildNotCoveredByAdsp(relevantState, [patternA, patternB], [], serviceMapping);

    expect(result).toEqual([
      {
        requirement: 'Fee or payment collection',
        reason: 'No ADSP service accepts or reconciles payments.',
        suggestedApproach:
          'Integrate a third-party payment gateway for application and booking fees, and record the paid status against the related record (case or booking).',
      },
    ]);
  });

  it('does not merge a category item when only one pattern contributes it', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay an application fee.' };
    const patternA = {
      ...pattern,
      id: 'a',
      unsupportedCapabilities: [
        {
          requirement: 'Fee payment',
          reason: 'No service',
          suggestedApproach: 'Build it',
          keywords: ['application fee'],
          category: 'payment-collection',
        },
      ],
    } as BusinessPattern;

    expect(buildNotCoveredByAdsp(relevantState, [patternA], [], serviceMapping)).toEqual([
      { requirement: 'Fee payment', reason: 'No service', suggestedApproach: 'Build it' },
    ]);
  });

  it('includes ai-flagged items alongside pattern items', () => {
    const aiItems = [
      { requirement: 'On-site check-in', reason: 'No kiosk service', suggestedApproach: 'Build a kiosk app' },
    ];

    expect(buildNotCoveredByAdsp(state, [], aiItems, serviceMapping)).toEqual(aiItems);
  });

  it('excludes an item whose requirement matches a recommended service', () => {
    const mapping = [{ ...serviceMapping[0], service: 'value-service', displayName: 'Value service' }];
    const aiItems = [{ requirement: 'value-service', reason: 'x', suggestedApproach: 'y' }];

    expect(buildNotCoveredByAdsp(state, [], aiItems, mapping)).toEqual([]);
  });

  it('returns an empty array when nothing is uncovered', () => {
    expect(buildNotCoveredByAdsp(state, [pattern], [], serviceMapping)).toEqual([]);
  });

  it('merges an ai item into the same category as a pattern item when the model tags it explicitly', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay an application fee to reserve a campsite.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts or reconciles payments.',
          suggestedApproach: 'Build it',
          keywords: ['application fee'],
          category: 'payment-collection',
          feeType: 'application',
          recordType: 'case',
        },
      ],
    } as BusinessPattern;
    const aiItems = [
      {
        requirement: 'Campsite deposit intake',
        reason: 'No ADSP service accepts or reconciles payments.',
        suggestedApproach: 'Use a payment gateway',
        category: 'payment-collection',
      },
    ];

    const result = buildNotCoveredByAdsp(relevantState, [patternWithGaps], aiItems, serviceMapping);

    expect(result).toHaveLength(1);
    expect(result[0].requirement).toBe('Fee or payment collection');
  });

  it('merges an ai item into payment-collection by keyword when the model omits the category', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay an application fee to reserve a campsite.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts or reconciles payments.',
          suggestedApproach: 'Build it',
          keywords: ['application fee'],
          category: 'payment-collection',
        },
      ],
    } as BusinessPattern;
    const aiItems = [
      { requirement: 'Campsite deposit intake', reason: 'No ADSP service accepts or reconciles payments.', suggestedApproach: 'Use a gateway' },
    ];

    expect(buildNotCoveredByAdsp(relevantState, [patternWithGaps], aiItems, serviceMapping)).toHaveLength(1);
  });

  it('does not infer payment-collection for an ai item describing disbursement', () => {
    const relevantState = { ...state, problemStatement: 'Applicants pay an application fee to reserve a campsite.' };
    const patternWithGaps = {
      ...pattern,
      unsupportedCapabilities: [
        {
          requirement: 'Fee or payment processing',
          reason: 'No ADSP service accepts or reconciles payments.',
          suggestedApproach: 'Build it',
          keywords: ['application fee'],
          category: 'payment-collection',
        },
      ],
    } as BusinessPattern;
    const aiItems = [
      { requirement: 'Refund disbursement to recipients', reason: 'No ADSP service issues fund transfers.', suggestedApproach: 'Use the financial system' },
    ];

    expect(buildNotCoveredByAdsp(relevantState, [patternWithGaps], aiItems, serviceMapping)).toHaveLength(2);
  });
});
