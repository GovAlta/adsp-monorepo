import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { SolutionDetail } from './solutionDetail';
import { usePlannerApi } from './api';
import { Solution } from './model';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: jest.fn() }));
jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));

describe('SolutionDetail', () => {
  const api = {
    getSolution: jest.fn(),
    analyze: jest.fn(),
    consult: jest.fn(),
    handoff: jest.fn(),
  };

  const emptySolution: Solution = {
    id: 'solution-1',
    name: 'Permit intake',
    scenario: 'new',
    status: 'draft',
    createdByName: 'Pat Planner',
    updatedOn: '2026-03-01T10:00:00.000Z',
    revision: 1,
    state: {
      problemStatement: 'Applicants submit permit forms.',
      concepts: [],
      decisions: [],
      questions: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
  };

  const analyzedSolution: Solution = {
    ...emptySolution,
    status: 'analyzed',
    state: {
      ...emptySolution.state,
      concepts: [{ id: 'c-1', type: 'actor', name: 'applicants', source: 'extracted' }],
      decisions: [
        {
          id: 'd-1',
          title: 'Authentication',
          decision: 'Use Alberta.ca accounts',
          reason: 'Citizens already have them',
          decidedOn: '2026-03-01',
        },
      ],
      questions: [
        { id: 'q-1', question: 'Is staff review required?', raisedBy: 'planner', status: 'open' },
        { id: 'q-2', question: 'Is a fee collected?', raisedBy: 'planner', status: 'answered', answer: 'No' },
      ],
      hypotheses: [
        {
          id: 'h-1',
          title: 'Permitting solution',
          patternId: 'permitting',
          confidence: 'high',
          rationale: 'This looks like a Permitting problem.',
          recommendations: [{ service: 'form-service', reason: 'Intake forms.', order: 3 }],
          assumptions: ['Applicants authenticate'],
          unknowns: ['Retention period'],
        },
      ],
      specialists: [{ service: 'form-service', status: 'consulted', updatedOn: '2026-03-01' }],
      nextSteps: [{ title: 'Consult form-service', service: 'form-service', reason: 'Intake forms.' }],
    },
  };

  const click = (container: HTMLElement, testId: string) =>
    fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'solution-1' });
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    api.getSolution.mockResolvedValue(analyzedSolution);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading indicator while the solution loads', () => {
    api.getSolution.mockReturnValue(new Promise(() => undefined));

    const { container } = render(<SolutionDetail />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('loads the solution identified by the route', async () => {
    const { findByTestId } = render(<SolutionDetail />);
    await findByTestId('solution-title');

    expect(api.getSolution).toHaveBeenCalledWith('solution-1');
  });

  it('shows the solution name as the title', async () => {
    const { findByTestId } = render(<SolutionDetail />);

    expect((await findByTestId('solution-title')).textContent).toBe('Permit intake');
  });

  it('returns to the solutions list when the solution cannot be loaded', async () => {
    api.getSolution.mockRejectedValue(new Error('Not found'));

    render(<SolutionDetail />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('../solutions'));
  });

  it('returns to the solutions list from the back button', async () => {
    const { container, findByTestId } = render(<SolutionDetail />);
    await findByTestId('solution-title');

    click(container, 'back-to-solutions');

    expect(mockNavigate).toHaveBeenCalledWith('../solutions');
  });

  it('populates the problem statement from the solution', async () => {
    const { container, findByTestId } = render(<SolutionDetail />);
    await findByTestId('solution-title');

    expect(container.querySelector('goa-textarea[testid="solution-problem"]')?.getAttribute('value')).toBe(
      'Applicants submit permit forms.',
    );
  });

  describe('analysis', () => {
    it('analyzes the edited problem statement', async () => {
      api.analyze.mockResolvedValue(analyzedSolution);
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');
      fireEvent(
        container.querySelector('goa-textarea[testid="solution-problem"]') as Element,
        new CustomEvent('_change', { detail: { value: 'Inspectors record findings.' } }),
      );

      click(container, 'analyze-solution');

      expect(api.analyze).toHaveBeenCalledWith('solution-1', 'Inspectors record findings.');
    });

    it('shows the analysis result', async () => {
      api.analyze.mockResolvedValue({ ...analyzedSolution, name: 'Permit intake (analyzed)' });
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'analyze-solution');

      await waitFor(() =>
        expect(container.querySelector('[data-testid="solution-title"]')?.textContent).toBe(
          'Permit intake (analyzed)',
        ),
      );
    });

    it('keeps the current solution when analysis fails', async () => {
      api.analyze.mockRejectedValue(new Error('Network Error'));
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'analyze-solution');

      await waitFor(() => expect(api.analyze).toHaveBeenCalled());
      expect(container.querySelector('[data-testid="solution-title"]')?.textContent).toBe('Permit intake');
    });

    it('disables analysis when the problem statement is blank', async () => {
      api.getSolution.mockResolvedValue({
        ...analyzedSolution,
        state: { ...analyzedSolution.state, problemStatement: '  ' },
      });
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      expect(container.querySelector('goa-button[testid="analyze-solution"]')?.getAttribute('disabled')).toBe('true');
    });
  });

  describe('recommendations', () => {
    it('prompts to analyze when there are no hypotheses', async () => {
      api.getSolution.mockResolvedValue(emptySolution);

      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      expect(container.querySelector('goa-callout')?.getAttribute('heading')).toBe('No recommendations yet');
    });

    it('shows each hypothesis title', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('Permitting solution')).toBeTruthy();
    });

    it('shows the hypothesis rationale', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('This looks like a Permitting problem.')).toBeTruthy();
    });

    it('shows the hypothesis confidence badge', async () => {
      const { container, findByText } = render(<SolutionDetail />);
      await findByText('Permitting solution');

      expect(container.querySelector('goa-badge')?.getAttribute('content')).toBe('high confidence');
    });

    it('shows the recommended service reason', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('Intake forms.')).toBeTruthy();
    });

    it('shows the specialist progress for a recommended service', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('consulted')).toBeTruthy();
    });

    it('shows not-started for a recommended service without progress', async () => {
      api.getSolution.mockResolvedValue({
        ...analyzedSolution,
        state: { ...analyzedSolution.state, specialists: [] },
      });

      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('not-started')).toBeTruthy();
    });

    it('lists assumptions', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('Assumption: Applicants authenticate')).toBeTruthy();
    });

    it('lists unknowns to validate', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('To validate: Retention period')).toBeTruthy();
    });
  });

  describe('consulting a specialist', () => {
    const consultResult = {
      service: 'form-service',
      fit: 'recommended',
      reason: 'Intake forms.',
      questions: ['Who completes the form?'],
      dependencies: [
        { service: 'file-service', satisfied: true },
        { service: 'event-service', satisfied: false },
      ],
      risks: ['Attachments need file types first.'],
    };

    beforeEach(() => {
      api.consult.mockResolvedValue(consultResult);
    });

    it('consults the selected service', async () => {
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      expect(api.consult).toHaveBeenCalledWith('solution-1', 'form-service');
    });

    it('shows the consultation heading with service and fit', async () => {
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      await waitFor(() =>
        expect(container.querySelector('goa-callout[testid="consult-result"]')?.getAttribute('heading')).toBe(
          'form-service: recommended',
        ),
      );
    });

    it('shows consultation questions', async () => {
      const { container, findByTestId, findByText } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      expect(await findByText('Who completes the form?')).toBeTruthy();
    });

    it('shows satisfied dependencies as in plan', async () => {
      const { container, findByTestId, findByText } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      expect(await findByText('Depends on file-service (in plan)')).toBeTruthy();
    });

    it('shows unsatisfied dependencies as not in plan', async () => {
      const { container, findByTestId, findByText } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      expect(await findByText('Depends on event-service (not in plan)')).toBeTruthy();
    });

    it('shows consultation risks', async () => {
      const { container, findByTestId, findByText } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      expect(await findByText('Risk: Attachments need file types first.')).toBeTruthy();
    });

    it('reloads the solution after consulting to refresh progress', async () => {
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'consult-form-service');

      await waitFor(() => expect(api.getSolution).toHaveBeenCalledTimes(2));
    });
  });

  describe('handing off to a specialist workspace', () => {
    it('requests a handoff for the selected service', async () => {
      api.handoff.mockResolvedValue({ workspacePath: '/admin/services/form', solution: analyzedSolution });
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'handoff-form-service');

      expect(api.handoff).toHaveBeenCalledWith('solution-1', 'form-service');
    });

    it('navigates to the specialist workspace', async () => {
      api.handoff.mockResolvedValue({ workspacePath: '/admin/services/form', solution: analyzedSolution });
      const { container, findByTestId } = render(<SolutionDetail />);
      await findByTestId('solution-title');

      click(container, 'handoff-form-service');

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/services/form'));
    });
  });

  describe('solution model sections', () => {
    it('lists open questions', async () => {
      const { findByTestId } = render(<SolutionDetail />);

      expect((await findByTestId('open-questions')).textContent).toContain('Is staff review required?');
    });

    it('excludes answered questions from open questions', async () => {
      const { findByTestId } = render(<SolutionDetail />);

      expect((await findByTestId('open-questions')).textContent).not.toContain('Is a fee collected?');
    });

    it('states when there are no open questions', async () => {
      api.getSolution.mockResolvedValue(emptySolution);

      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('No open questions.')).toBeTruthy();
    });

    it('lists captured concepts', async () => {
      const { container, findByText } = render(<SolutionDetail />);
      await findByText('Business model');

      expect(container.querySelector('goa-table[testid="concepts-table"]')?.textContent).toContain('applicants');
    });

    it('states when no concepts are captured', async () => {
      api.getSolution.mockResolvedValue(emptySolution);

      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('No concepts captured yet.')).toBeTruthy();
    });

    it('lists decisions with their reasons', async () => {
      const { findByText } = render(<SolutionDetail />);

      expect(await findByText(/Use Alberta.ca accounts — Citizens already have them/)).toBeTruthy();
    });

    it('states when no decisions are recorded', async () => {
      api.getSolution.mockResolvedValue(emptySolution);

      const { findByText } = render(<SolutionDetail />);

      expect(await findByText('No decisions recorded.')).toBeTruthy();
    });

    it('lists next steps', async () => {
      const { findByTestId } = render(<SolutionDetail />);

      expect((await findByTestId('next-steps')).textContent).toContain('Consult form-service.');
    });
  });
});
