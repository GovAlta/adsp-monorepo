import { chatToMarkdown, download, fmtDate, harnessToMarkdown, safeName, solutionToMarkdown } from './utils';
import { BlueprintComponent, Solution, SolutionBlueprint, SpecialistChat } from './model';

const solution = (state: Partial<Solution['state']> = {}): Solution => ({
  id: 's1',
  name: 'Permit Intake!',
  scenario: 'new',
  status: 'analyzed',
  createdByName: 'tester',
  updatedOn: '2026-01-01T00:00:00Z',
  version: 2,
  lastUpdated: '2026-01-02T00:00:00Z',
  changedSections: ['Problem statement'],
  state: {
    problemStatement: 'Applicants submit permits.',
    concepts: [{ id: 'c1', type: 'actor', name: 'Applicant', source: 'user' }],
    decisions: [],
    questions: [{ id: 'q1', question: 'Who approves?', raisedBy: 'planner', status: 'answered', answer: 'Officer' }],
    hypotheses: [
      {
        id: 'h1',
        title: 'Form workflow',
        patternId: 'p',
        confidence: 'high',
        rationale: 'Because.',
        recommendations: [
          { service: 'file-service', reason: 'second', order: 2 },
          { service: 'form-service', reason: 'first', order: 1 },
        ],
        assumptions: ['A1'],
        unknowns: [],
      },
    ],
    specialists: [],
    nextSteps: [{ title: 'Start', reason: 'Go' }],
    ...state,
  },
});

const blueprint: SolutionBlueprint = {
  generatedOn: '2026-01-01',
  mode: 'ai',
  overview: {
    title: 'Overview',
    summary: 'Sum',
    objectives: ['Obj'],
    scope: [],
    outOfScope: [],
    stakeholders: [],
    successMeasures: [],
    risks: [],
  },
  architecture: {
    summary: 'Arch',
    layers: [{ name: 'UI', description: 'front', components: ['web'] }],
    integrations: ['Int'],
    security: ['Sec'],
    diagram: 'A-->B',
  },
  serviceMapping: [
    { order: 1, service: 'form-service', displayName: 'Form', role: 'Forms', reason: 'why', dependsOn: ['x'], capabilities: ['Drafts'] },
  ],
  specialistNotes: [
    {
      service: 'form-service',
      displayName: 'Form',
      fit: 'recommended',
      source: 'ai',
      summary: 'Note',
      supports: ['S'],
      constraints: [],
      questions: [],
      risks: [],
      validation: { verdict: 'sound', findings: ['F'] },
      chatHighlights: ['H'],
      consultedOn: 'x',
    },
  ],
  workflows: [{ name: 'Apply', actors: ['Citizen'], steps: ['Submit'] }],
  dataGovernance: { dataEntities: ['DE'], accessControl: [], retention: [], privacy: [], audit: [], compliance: ['C'] },
  delivery: { phases: [{ name: 'Phase 1', items: ['I1'] }], nonFunctional: ['NF'], openQuestions: ['OQ'] },
  components: [],
};

const component: BlueprintComponent = {
  order: 1,
  service: 'form-service',
  type: 'Form definition',
  name: 'Permit application',
  purpose: 'Collects applications',
  dependsOn: ['Applicant role'],
  openDecisions: ['Allow drafts?'],
  target: 'adsp',
  setup: { where: 'Tenant admin > Form', docs: 'https://docs/form', how: 'Create the definition' },
};

describe('utils', () => {
  describe('safeName', () => {
    it('slugifies the name', () => {
      expect(safeName({ name: 'Permit Intake!' })).toBe('permit-intake');
    });

    it('falls back to solution', () => {
      expect(safeName({ name: '!!!' })).toBe('solution');
    });
  });

  it('formats dates using the locale', () => {
    expect(fmtDate('2026-01-01T00:00:00Z')).toBe(new Date('2026-01-01T00:00:00Z').toLocaleString());
  });

  describe('download', () => {
    it('creates, clicks and removes an anchor', () => {
      const createObjectURL = jest.fn(() => 'blob:1');
      const revokeObjectURL = jest.fn();
      Object.assign(URL, { createObjectURL, revokeObjectURL });
      const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

      download('a.json', '{}', 'application/json');

      expect(createObjectURL).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:1');
      expect(document.querySelector('a')).toBeNull();
      click.mockRestore();
    });
  });

  describe('chatToMarkdown', () => {
    const chat: SpecialistChat = {
      id: 'c1',
      service: 'form-service',
      title: 'Forms chat',
      createdOn: '2026-01-01T00:00:00Z',
      updatedOn: '2026-01-02T00:00:00Z',
      messages: [
        { role: 'user', content: 'How?', at: '2026-01-01T00:00:00Z' },
        {
          role: 'assistant',
          content: 'Like this.',
          at: '2026-01-01T00:00:00Z',
          mode: 'rules',
          suggestions: ['Use schemas'],
          validation: { verdict: 'sound', findings: ['ok'] },
          samples: [{ language: 'ts', title: 'Snippet', code: 'const a = 1;' }],
          consult: { fit: 'recommended', risks: ['r1'] },
        },
      ],
    };

    it('renders messages, rule-based marker and sections', () => {
      const md = chatToMarkdown(chat);

      expect(md).toContain('## Forms chat');
      expect(md).toContain('### You (');
      expect(md).toContain(', rule-based)');
      expect(md).toContain('**Verdict:** sound');
      expect(md).toContain('- Use schemas');
      expect(md).toContain('```ts\nconst a = 1;\n```');
      expect(md).toContain('Fit: recommended');
      expect(md).toContain('- r1');
    });
  });

  describe('solutionToMarkdown', () => {
    it('renders core sections with ordered recommendations', () => {
      const md = solutionToMarkdown(solution());

      expect(md).toContain('# Permit Intake!');
      expect(md).toContain('solution-version: 2');
      expect(md).toContain(`last-updated: ${fmtDate('2026-01-02T00:00:00Z')}`);
      expect(md).toContain("## What's changed");
      expect(md).toContain('- Problem statement');
      expect(md).toContain('Applicants submit permits.');
      expect(md.indexOf('1. **form-service**')).toBeLessThan(md.indexOf('2. **file-service**'));
      expect(md).toContain('- A1');
      expect(md).toContain('  - Answer: Officer');
      expect(md).not.toContain('# Project blueprint');
    });

    it('labels the version as having unsaved changes', () => {
      const md = solutionToMarkdown({ ...solution(), unsavedChanges: true });

      expect(md).toContain('solution-version: 2 (unsaved changes)');
    });

    it('falls back to the solution update time when the export has no last-updated time', () => {
      const md = solutionToMarkdown({ ...solution(), lastUpdated: undefined });

      expect(md).toContain(`last-updated: ${fmtDate('2026-01-01T00:00:00Z')}`);
    });

    it('shows no changes when the export lists no changed sections', () => {
      const md = solutionToMarkdown({ ...solution(), changedSections: [] });

      expect(md).toContain('No changes since the previous version.');
      expect(md).not.toContain('- Problem statement');
    });

    it('shows "Initial version" on the first version instead of "No changes"', () => {
      const md = solutionToMarkdown({ ...solution(), version: 1, initial: true, changedSections: [] });

      expect(md).toContain('Initial version.');
      expect(md).not.toContain('No changes since the previous version.');
    });

    it('warns when the blueprint may be out of date', () => {
      const md = solutionToMarkdown({ ...solution(), blueprintOutOfDate: true });

      expect(md).toContain('Blueprint may be out of date. Regenerate it.');
    });

    it('does not warn when the blueprint is up to date', () => {
      const md = solutionToMarkdown({ ...solution(), blueprintOutOfDate: false });

      expect(md).not.toContain('Blueprint may be out of date.');
    });

    it('includes discovery and analysis', () => {
      const md = solutionToMarkdown(
        solution({
          analysis: { mode: 'rules', warning: 'fallback', analyzedOn: 'x' },
          discovery: {
            messages: [{ role: 'assistant', content: 'Line1\n\nLine2', at: 'x' }],
            confidence: 80,
            threshold: 70,
            factors: [],
            ready: true,
            mode: 'rules',
            updatedOn: 'x',
          },
          conversation: [{ role: 'user', content: 'Hi', at: 'x' }],
        }),
      );

      expect(md).toContain('_Analysis: rule-based — fallback_');
      expect(md).toContain('- **Planner:** Line1 Line2');
      expect(md).toContain('- **You:** Hi');
    });

    it('shows only the chosen approach', () => {
      const [chosen] = solution().state.hypotheses;
      const md = solutionToMarkdown(solution({ hypotheses: [chosen, { ...chosen, id: 'h2', title: 'Runner-up' }] }));

      expect(md).toContain('## Chosen approach\n\n### Form workflow\n\nBecause.');
      expect(md).not.toContain('Runner-up');
    });

    it('lists recorded decisions with their reasons', () => {
      const md = solutionToMarkdown(
        solution({
          decisions: [
            { id: 'd1', title: 'Intake channel', decision: 'Online only', reason: 'Paper volume is low.', decidedOn: 'x' },
            { id: 'd2', title: 'Fees', decision: 'No fee.', reason: '', decidedOn: 'x' },
          ],
        }),
      );

      expect(md).toContain(
        '## Recorded decisions\n\n- **Intake channel**: Online only. _Why:_ Paper volume is low.\n- **Fees**: No fee.\n',
      );
    });

    it('includes every blueprint section', () => {
      const md = solutionToMarkdown(solution({ blueprint }));

      expect(md).toContain('# Project blueprint');
      expect(md).toContain('## 1. Overview');
      expect(md).toContain('- Obj');
      expect(md).toContain('A-->B');
      expect(md).toContain('1. **form-service** — Forms. _Why:_ why _Depends on:_ x\n   - Drafts');
      expect(md).not.toContain('## 4. Not covered by ADSP');
      expect(md).toContain('### Form (recommended, ai)');
      expect(md).toContain('**Validation: sound**');
      expect(md).toContain('Actors: Citizen');
      expect(md).toContain('1. Submit');
      expect(md).toContain('**Data entities**');
      expect(md).toContain('**Phase 1**');
      expect(md).toContain('**Open questions**');
    });

    it('shows the roles table with open cells marked', () => {
      const roles = [{ actor: 'Program officer', appRole: '', productType: 'workspace' as const }];
      const md = solutionToMarkdown(solution({ blueprint: { ...blueprint, overview: { ...blueprint.overview, roles } } }));

      expect(md).toContain(
        '**Roles**\n\n| Actor | App role | GoA product type |\n|---|---|---|\n| Program officer | _Open_ | workspace |',
      );
    });

    it('keeps a role on one table row when its text has a pipe or a line break', () => {
      const roles = [{ actor: 'Officer | lead', appRole: 'Reviews\n  and approves', productType: '' as const }];
      const md = solutionToMarkdown(solution({ blueprint: { ...blueprint, overview: { ...blueprint.overview, roles } } }));

      expect(md).toContain('| Officer \\| lead | Reviews and approves | _Open_ |\n');
    });

    it('keeps a role on one table row when a backslash comes before a pipe', () => {
      const roles = [{ actor: 'a\\|b', appRole: '', productType: '' as const }];
      const md = solutionToMarkdown(solution({ blueprint: { ...blueprint, overview: { ...blueprint.overview, roles } } }));

      expect(md).toContain('| a\\\\\\|b | _Open_ | _Open_ |\n');
    });

    it('indents service capabilities under two-digit numbers so the list keeps its numbering', () => {
      const md = solutionToMarkdown(
        solution({ blueprint: { ...blueprint, serviceMapping: [{ ...blueprint.serviceMapping[0], order: 10 }] } }),
      );

      expect(md).toContain('10. **form-service** — Forms. _Why:_ why _Depends on:_ x\n    - Drafts');
    });

    it('does not double the period when an ai-generated service role already ends with one', () => {
      const md = solutionToMarkdown(
        solution({
          blueprint: {
            generatedOn: '2026-01-01',
            mode: 'ai',
            overview: { title: '', summary: '', objectives: [], scope: [], outOfScope: [], stakeholders: [], successMeasures: [], risks: [] },
            architecture: { summary: '', layers: [], integrations: [], security: [], diagram: '' },
            serviceMapping: [
              { order: 1, service: 'form-service', displayName: 'Form', role: 'Collects administrative touchpoints.', reason: 'why', dependsOn: [], capabilities: [] },
            ],
            specialistNotes: [],
            workflows: [],
            dataGovernance: { dataEntities: [], accessControl: [], retention: [], privacy: [], audit: [], compliance: [] },
            delivery: { phases: [], nonFunctional: [], openQuestions: [] },
            components: [],
          },
        })
      );

      expect(md).toContain('1. **form-service** — Collects administrative touchpoints. _Why:_ why');
      expect(md).not.toContain('touchpoints.. _Why:_');
    });

    it('lists the not-covered items between service mapping and specialist notes', () => {
      const md = solutionToMarkdown(
        solution({
          blueprint: {
            generatedOn: '2026-01-01',
            mode: 'rules',
            overview: {
              title: '',
              summary: '',
              objectives: [],
              scope: [],
              outOfScope: [],
              stakeholders: [],
              successMeasures: [],
              risks: [],
            },
            architecture: { summary: '', layers: [], integrations: [], security: [], diagram: '' },
            serviceMapping: [],
            notCoveredByAdsp: [
              {
                requirement: 'Fee processing',
                reason: 'No service accepts payments.',
                suggestedApproach: 'Use a gateway.',
              },
            ],
            specialistNotes: [],
            workflows: [],
            dataGovernance: {
              dataEntities: [],
              accessControl: [],
              retention: [],
              privacy: [],
              audit: [],
              compliance: [],
            },
            delivery: { phases: [], nonFunctional: [], openQuestions: [] },
            components: [],
          },
        }),
      );

      expect(md).toContain('## 4. Not covered by ADSP');
      expect(md).toContain('- **Fee processing** — No service accepts payments. _Suggested approach:_ Use a gateway.');
      expect(md).toContain('## 6. Specialist consultation notes');
      expect(md.indexOf('## 4. Not covered by ADSP')).toBeLessThan(md.indexOf('## 6. Specialist consultation notes'));
    });

    it('shows the all-covered message when notCoveredByAdsp is empty', () => {
      const md = solutionToMarkdown(
        solution({
          blueprint: {
            generatedOn: '2026-01-01',
            mode: 'rules',
            overview: {
              title: '',
              summary: '',
              objectives: [],
              scope: [],
              outOfScope: [],
              stakeholders: [],
              successMeasures: [],
              risks: [],
            },
            architecture: { summary: '', layers: [], integrations: [], security: [], diagram: '' },
            serviceMapping: [],
            notCoveredByAdsp: [],
            specialistNotes: [],
            workflows: [],
            dataGovernance: {
              dataEntities: [],
              accessControl: [],
              retention: [],
              privacy: [],
              audit: [],
              compliance: [],
            },
            delivery: { phases: [], nonFunctional: [], openQuestions: [] },
            components: [],
          },
        }),
      );

      expect(md).toContain('_All requirements map to ADSP services._');
    });

    it('lists the components to set up after the not-covered items', () => {
      const md = solutionToMarkdown(
        solution({ blueprint: { ...blueprint, notCoveredByAdsp: [], components: [component] } }),
      );

      expect(md).toContain(
        '1. **Permit application** (Form definition, form-service): Not reviewed. Collects applications _Depends on:_ Applicant role\n' +
          '   - Where: Tenant admin > Form\n' +
          '   - How: Create the definition\n' +
          '   - Docs: https://docs/form\n' +
          '   - Open decision: Allow drafts?'
      );
      expect(md.match(/^## \d\. .+$/gm)).toEqual([
        '## 1. Overview',
        '## 2. Technical architecture',
        '## 3. ADSP service mapping',
        '## 4. Not covered by ADSP',
        '## 5. Components to set up',
        '## 6. Specialist consultation notes',
        '## 7. Core workflows',
        '## 8. Data & governance',
        '## 9. Delivery plan & other considerations',
      ]);
    });

    it('shows the review status of each component and leaves rejected ones out', () => {
      const md = solutionToMarkdown(
        solution({
          blueprint: {
            ...blueprint,
            components: [
              { ...component, review: 'approved' },
              { ...component, order: 2, name: 'Reviewer role', review: 'rejected' },
              { ...component, order: 3, name: 'Staff role', review: 'not-reviewed' },
            ],
          },
        }),
      );

      expect(md).toContain('1. **Permit application** (Form definition, form-service): Approved. Collects applications');
      expect(md).toContain('3. **Staff role** (Form definition, form-service): Not reviewed. Collects applications');
      expect(md).not.toContain('Reviewer role');
    });

    it('indents component details under two-digit numbers so the list keeps its numbering', () => {
      const md = solutionToMarkdown(solution({ blueprint: { ...blueprint, components: [{ ...component, order: 10 }] } }));

      expect(md).toContain('10. **Permit application**');
      expect(md).toContain('\n    - Where: Tenant admin > Form\n');
      expect(md).toContain('\n    - Open decision: Allow drafts?');
    });

    it('renders an empty components section for a blueprint saved before components existed', () => {
      const md = solutionToMarkdown(solution({ blueprint: { ...blueprint, components: undefined } }));

      expect(md).toContain('## 5. Components to set up');
      expect(md).toContain('## 6. Specialist consultation notes');
    });
  });

  describe('harnessToMarkdown', () => {
    it('fills the name, slug and version', () => {
      const md = harnessToMarkdown(solution());

      expect(md).toContain('# Build Permit Intake!: harness instructions');
      expect(md).toContain('`planner-permit-intake.md`: the plan, solution version 2;');
      expect(md).not.toMatch(/\{(name|slug|file|n|component list)\}/);
    });

    it('labels the version as having unsaved changes', () => {
      const md = harnessToMarkdown({ ...solution(), unsavedChanges: true });

      expect(md).toContain('`solution-version: 2 (unsaved changes)`');
    });

    it('lists the components with their review status and leaves rejected ones out', () => {
      const md = harnessToMarkdown(
        solution({
          blueprint: {
            ...blueprint,
            components: [
              { ...component, review: 'approved' },
              { ...component, order: 2, name: 'Reviewer role', review: 'rejected' },
              { ...component, order: 3, name: 'Staff role' },
            ],
          },
        }),
      );

      expect(md).toContain(
        '1. **Permit application** (Form definition, form-service): Approved\n' +
          '3. **Staff role** (Form definition, form-service): Not reviewed',
      );
      expect(md).not.toContain('Reviewer role');
    });

    it("sets up each component from the plan's section 5 instead of assuming", () => {
      const md = harnessToMarkdown(solution());

      expect(md).toContain('Set up each component below in order, exactly as section 5 of the plan describes');
      expect(md).toContain('Never fill a gap with an assumption');
    });

    it('says there are no components when there is no blueprint', () => {
      expect(harnessToMarkdown(solution())).toContain('_No components._');
    });

    it('keeps replacement patterns in the name literal', () => {
      expect(harnessToMarkdown({ ...solution(), name: 'Fees $& more' })).toContain('# Build Fees $& more: harness');
    });
  });
});
