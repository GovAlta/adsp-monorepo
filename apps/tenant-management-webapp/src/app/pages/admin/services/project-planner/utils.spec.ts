import { chatToMarkdown, download, fmtDate, safeName, solutionToMarkdown } from './utils';
import { Solution, SpecialistChat } from './model';

const solution = (state: Partial<Solution['state']> = {}): Solution => ({
  id: 's1',
  name: 'Permit Intake!',
  scenario: 'new',
  status: 'analyzed',
  createdByName: 'tester',
  updatedOn: '2026-01-01T00:00:00Z',
  version: '1.1',
  versionHistory: [
    { version: '1.1', changedAt: '2026-01-02T00:00:00Z', changedBy: 'tester', changedSections: ['Problem statement'] },
  ],
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
      expect(md).toContain('solution-version: 1.1');
      expect(md).toContain(`last-updated: ${fmtDate('2026-01-02T00:00:00Z')}`);
      expect(md).toContain("## What's changed");
      expect(md).toContain('- Problem statement');
      expect(md).toContain('Applicants submit permits.');
      expect(md.indexOf('1. **form-service**')).toBeLessThan(md.indexOf('2. **file-service**'));
      expect(md).toContain('- A1');
      expect(md).toContain('  - Answer: Officer');
      expect(md).not.toContain('# Project blueprint');
    });

    it('shows no changes on a re-export that did not bump, instead of repeating the last bump', () => {
      const md = solutionToMarkdown({
        ...solution(),
        version: '1.1',
        changedSections: [],
        lastUpdated: '2026-01-03T00:00:00Z',
      });

      expect(md).toContain(`last-updated: ${fmtDate('2026-01-03T00:00:00Z')}`);
      expect(md).toContain('No changes since the previous version.');
      expect(md).not.toContain('- Problem statement');
    });

    it('shows "Initial version" on the first export instead of "No changes"', () => {
      const md = solutionToMarkdown({ ...solution(), version: '1.0', versionHistory: [], initial: true, changedSections: [] });

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

    it('includes confidence, discovery and analysis', () => {
      const md = solutionToMarkdown(
        solution({
          analysis: { mode: 'rules', warning: 'fallback', analyzedOn: 'x' },
          confidence: { score: 80, threshold: 70, factors: [{ id: 'f', label: 'Actors', score: 90, note: 'clear' }] },
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
        })
      );

      expect(md).toContain('_Analysis: rule-based — fallback_');
      expect(md).toContain('## Confidence: 80% (threshold 70%)');
      expect(md).toContain('- Actors: 90% — clear');
      expect(md).toContain('- **Planner:** Line1 Line2');
      expect(md).toContain('- **You:** Hi');
    });

    it('includes every blueprint section', () => {
      const md = solutionToMarkdown(
        solution({
          blueprint: {
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
              { order: 1, service: 'form-service', displayName: 'Form', role: 'Forms', reason: 'why', dependsOn: ['x'], capabilities: [] },
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
          },
        })
      );

      expect(md).toContain('# Project blueprint');
      expect(md).toContain('## 1. Overview');
      expect(md).toContain('- Obj');
      expect(md).toContain('A-->B');
      expect(md).toContain('1. **form-service** — Forms. _Why:_ why _Depends on:_ x');
      expect(md).toContain('### Form (recommended, ai)');
      expect(md).toContain('**Validation: sound**');
      expect(md).toContain('Actors: Citizen');
      expect(md).toContain('1. Submit');
      expect(md).toContain('**Data entities**');
      expect(md).toContain('**Phase 1**');
      expect(md).toContain('**Open questions**');
    });
  });
});
