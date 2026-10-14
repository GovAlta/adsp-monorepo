import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Solutions } from './solutions';
import { usePlannerApi } from './api';
import { Solution } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));

describe('Solutions', () => {
  const api = {
    listSolutions: jest.fn(),
    createSolution: jest.fn(),
    analyze: jest.fn(),
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

  const onSelect = jest.fn();

  beforeEach(() => {
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    api.listSolutions.mockResolvedValue([permitIntake]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading indicator while solutions are loading', () => {
    api.listSolutions.mockReturnValue(new Promise(() => undefined));

    const { container } = render(<Solutions onSelect={onSelect} />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('lists solutions by name', async () => {
    const { findByText } = render(<Solutions onSelect={onSelect} />);

    expect(await findByText('Permit intake')).toBeTruthy();
  });

  it('shows the solution status badge', async () => {
    const { container, findByText } = render(<Solutions onSelect={onSelect} />);
    await findByText('Permit intake');

    expect(container.querySelector('goa-badge')?.getAttribute('content')).toBe('draft');
  });

  it('shows an empty message when there are no solutions', async () => {
    api.listSolutions.mockResolvedValue([]);

    const { findByTestId } = render(<Solutions onSelect={onSelect} />);

    expect((await findByTestId('no-solutions')).textContent).toContain('No solutions yet');
  });

  it('shows the empty message when loading solutions fails', async () => {
    api.listSolutions.mockRejectedValue(new Error('Network Error'));

    const { findByTestId } = render(<Solutions onSelect={onSelect} />);

    expect(await findByTestId('no-solutions')).toBeTruthy();
  });

  it('selects a solution when it is clicked', async () => {
    const { container, findByText } = render(<Solutions onSelect={onSelect} />);
    await findByText('Permit intake');

    fireEvent.click(container.querySelector('[data-testid="select-solution-solution-1"]') as Element);

    expect(onSelect).toHaveBeenCalledWith('solution-1');
  });

  it('marks the selected solution as current', async () => {
    const { container, findByText } = render(<Solutions selectedId="solution-1" onSelect={onSelect} />);
    await findByText('Permit intake');

    expect(container.querySelector('[data-testid="select-solution-solution-1"]')?.getAttribute('aria-current')).toBe(
      'true',
    );
  });

  describe('new solution', () => {
    it('disables create until a name is entered', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);

      expect(container.querySelector('goa-button[testid="new-solution"]')?.getAttribute('disabled')).toBe('true');
    });

    it('enables create once a name is entered', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);

      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      expect(container.querySelector('goa-button[testid="new-solution"]')?.getAttribute('disabled')).toBeNull();
    });

    it('creates a solution with the trimmed name and no problem statement', async () => {
      api.createSolution.mockResolvedValue({ ...permitIntake, id: 'solution-2' });
      const { container } = render(<Solutions onSelect={onSelect} />);
      type(container, 'goa-input[testid="new-solution-name"]', ' Permit intake ');

      click(container, 'new-solution');

      await waitFor(() => expect(api.createSolution).toHaveBeenCalledWith('Permit intake', ''));
      expect(api.analyze).not.toHaveBeenCalled();
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('solution-2'));
    });

    it('clears the name field after creating', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions onSelect={onSelect} />);
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution');

      await waitFor(() =>
        expect(container.querySelector('goa-input[testid="new-solution-name"]')?.getAttribute('value')).toBe(''),
      );
    });

    it('stays on the page when creation fails', async () => {
      api.createSolution.mockRejectedValue(new Error('Network Error'));
      const { container } = render(<Solutions onSelect={onSelect} />);
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution');

      await waitFor(() => expect(api.createSolution).toHaveBeenCalled());
      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
