import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Solutions } from './solutions';
import { usePlannerApi } from './api';
import { Solution } from './model';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));

describe('Solutions', () => {
  const api = {
    listSolutions: jest.fn(),
    createSolution: jest.fn(),
    analyze: jest.fn(),
    deleteSolution: jest.fn(),
  };

  const makeSolution = (id: string, name: string): Solution => ({
    id,
    name,
    scenario: 'new',
    status: 'draft',
    createdByName: 'Pat Planner',
    updatedOn: '2026-03-01T10:00:00.000Z',
    revision: 1,
    state: {
      problemStatement: '',
      concepts: [],
      decisions: [],
      questions: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
    },
  });
  const permitIntake = makeSolution('solution-1', 'Permit intake');

  const click = (container: HTMLElement, testId: string) =>
    fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));
  const type = (container: HTMLElement, selector: string, value: string) =>
    fireEvent(container.querySelector(selector) as Element, new CustomEvent('_change', { detail: { value } }));

  beforeEach(() => {
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    api.listSolutions.mockResolvedValue([permitIntake]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading indicator while solutions are loading', () => {
    api.listSolutions.mockReturnValue(new Promise(() => undefined));

    const { container } = render(<Solutions />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('lists solutions by name', async () => {
    const { findByText } = render(<Solutions />);

    expect(await findByText('Permit intake')).toBeTruthy();
  });

  it('shows who created each solution', async () => {
    const { findByText } = render(<Solutions />);

    expect(await findByText('Pat Planner')).toBeTruthy();
  });

  it('shows the solution status badge', async () => {
    const { container, findByText } = render(<Solutions />);
    await findByText('Permit intake');

    expect(container.querySelector('goa-badge')?.getAttribute('content')).toBe('draft');
  });

  it('shows an empty message when there are no solutions', async () => {
    api.listSolutions.mockResolvedValue([]);

    const { findByTestId } = render(<Solutions />);

    expect((await findByTestId('no-solutions')).textContent).toContain('No solutions yet');
  });

  it('shows the empty message when loading solutions fails', async () => {
    api.listSolutions.mockRejectedValue(new Error('Network Error'));

    const { findByTestId } = render(<Solutions />);

    expect(await findByTestId('no-solutions')).toBeTruthy();
  });

  it('opens a solution detail page', async () => {
    const { container, findByText } = render(<Solutions />);
    await findByText('Permit intake');

    click(container, 'open-solution-solution-1');

    expect(mockNavigate).toHaveBeenCalledWith('../solution/solution-1');
  });

  it('deletes a solution and reloads the list', async () => {
    api.deleteSolution.mockResolvedValue(undefined);
    const { container, findByText } = render(<Solutions />);
    await findByText('Permit intake');

    click(container, 'delete-solution-solution-1');

    await waitFor(() => expect(api.listSolutions).toHaveBeenCalledTimes(2));
  });

  it('requests deletion of the selected solution', async () => {
    api.deleteSolution.mockResolvedValue(undefined);
    const { container, findByText } = render(<Solutions />);
    await findByText('Permit intake');

    click(container, 'delete-solution-solution-1');

    expect(api.deleteSolution).toHaveBeenCalledWith('solution-1');
  });

  describe('new solution modal', () => {
    it('is closed initially', () => {
      const { container } = render(<Solutions />);

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(false);
    });

    it('opens when new solution is selected', () => {
      const { container } = render(<Solutions />);

      click(container, 'new-solution');

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(true);
    });

    it('closes when cancel is selected', () => {
      const { container } = render(<Solutions />);
      click(container, 'new-solution');

      click(container, 'new-solution-cancel');

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(false);
    });

    it('disables create until a name is entered', () => {
      const { container } = render(<Solutions />);
      click(container, 'new-solution');

      expect(container.querySelector('goa-button[testid="new-solution-save"]')?.getAttribute('disabled')).toBe('true');
    });

    it('enables create once a name is entered', () => {
      const { container } = render(<Solutions />);
      click(container, 'new-solution');

      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      expect(container.querySelector('goa-button[testid="new-solution-save"]')?.getAttribute('disabled')).toBeNull();
    });

    it('creates and analyzes a solution that has a problem statement', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      api.analyze.mockResolvedValue({ ...permitIntake, id: 'solution-2' });
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', ' Permit intake ');
      type(container, 'goa-textarea[testid="new-solution-problem"]', ' Applicants submit permit forms. ');

      click(container, 'new-solution-save');

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('../solution/solution-2'));
    });

    it('trims the name and problem statement when creating', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      api.analyze.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', ' Permit intake ');
      type(container, 'goa-textarea[testid="new-solution-problem"]', ' Applicants submit permit forms. ');

      click(container, 'new-solution-save');

      await waitFor(() =>
        expect(api.createSolution).toHaveBeenCalledWith('Permit intake', 'Applicants submit permit forms.'),
      );
    });

    it('analyzes the newly created solution', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      api.analyze.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');
      type(container, 'goa-textarea[testid="new-solution-problem"]', 'Applicants submit permit forms.');

      click(container, 'new-solution-save');

      await waitFor(() => expect(api.analyze).toHaveBeenCalledWith('solution-1'));
    });

    it('skips analysis when there is no problem statement', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-save');

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('../solution/solution-1'));
      expect(api.analyze).not.toHaveBeenCalled();
    });

    it('closes the modal after creating', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-save');

      await waitFor(() => expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(false));
    });

    it('stays on the page and keeps the modal open when creation fails', async () => {
      api.createSolution.mockRejectedValue(new Error('Network Error'));
      const { container } = render(<Solutions />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-save');

      await waitFor(() => expect(api.createSolution).toHaveBeenCalled());
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
