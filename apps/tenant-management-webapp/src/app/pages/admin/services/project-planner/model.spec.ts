import * as model from './model';
import type { BusinessPattern, Solution, SolutionState } from './model';

describe('project-planner model', () => {
  it('loads without runtime exports because it only declares types', () => {
    expect(model).not.toHaveProperty('Solution');
  });

  it('accepts a complete solution shape', () => {
    const state: SolutionState = {
      problemStatement: 'Citizens need to apply for a grant online.',
      concepts: [{ id: 'c1', type: 'actor', name: 'Applicant', source: 'user' }],
      decisions: [],
      questions: [{ id: 'q1', question: 'Who approves?', raisedBy: 'planner', status: 'open' }],
      hypotheses: [],
      specialists: [{ service: 'form', status: 'consulted', updatedOn: '2026-10-12T00:00:00Z' }],
      nextSteps: [{ title: 'Define form', service: 'form', reason: 'Collect application' }],
    };
    const solution: Solution = {
      id: 's1',
      name: 'Grant intake',
      scenario: 'intake',
      status: 'draft',
      createdByName: 'Pat Planner',
      updatedOn: '2026-10-12T00:00:00Z',
      revision: 1,
      state,
    };

    expect(solution.state.concepts[0].name).toBe('Applicant');
  });

  it('accepts a business pattern shape', () => {
    const pattern: BusinessPattern = {
      id: 'application-intake',
      name: 'Application intake',
      description: 'Citizens submit applications for review.',
      domainLanguage: ['application'],
      serviceMappings: [{ service: 'form', reason: 'Collect data' }],
      clarifyingQuestions: ['Who reviews?'],
    };

    expect(pattern.serviceMappings).toHaveLength(1);
  });
});
