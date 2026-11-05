import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { Solutions } from './solutions';
import { usePlannerApi } from './api';
import { Solution } from './model';
import { download } from './utils';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  download: jest.fn(),
}));

describe('Solutions', () => {
  const api = {
    listSolutions: jest.fn(),
    createSolution: jest.fn(),
    deleteSolution: jest.fn(),
    exportSolution: jest.fn(),
    analyze: jest.fn(),
  };

  const makeSolution = (id: string, name: string): Solution => ({
    id,
    name,
    scenario: 'new',
    status: 'draft',
    createdByName: 'Pat Planner',
    updatedOn: '2026-03-01T10:00:00.000Z',
    version: 1,
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
    fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
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
    it('opens the create-solution modal without requiring a name first', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);

      click(container, 'new-solution');

      expect(container.querySelector('goa-modal[testid="new-solution-modal"]')?.getAttribute('open')).toBe('true');
      expect(container.querySelector('[data-testid="problem-statement"]')).not.toBeNull();
    });

    it('does not create a solution just by opening the modal', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);

      click(container, 'new-solution');

      expect(api.createSolution).not.toHaveBeenCalled();
    });

    it('disables submit until a name is entered', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');

      expect(container.querySelector('goa-button[testid="new-solution-submit"]')?.getAttribute('disabled')).toBe(
        'true',
      );
    });

    it('enables submit once a name is entered', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');

      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      expect(container.querySelector('goa-button[testid="new-solution-submit"]')?.getAttribute('disabled')).toBeNull();
    });

    it('creates a solution with the trimmed name and no problem statement', async () => {
      api.createSolution.mockResolvedValue({ ...permitIntake, id: 'solution-2' });
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', ' Permit intake ');

      click(container, 'new-solution-submit');

      await waitFor(() => expect(api.createSolution).toHaveBeenCalledWith('Permit intake', ''));
      expect(api.analyze).not.toHaveBeenCalled();
      await waitFor(() => expect(onSelect).toHaveBeenCalledWith('solution-2'));
    });

    it('creates a solution with the entered problem statement', async () => {
      api.createSolution.mockResolvedValue({ ...permitIntake, id: 'solution-2' });
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');
      type(container, 'goa-textarea[testid="problem-input"]', 'Applicants submit permits for staff review.');

      click(container, 'new-solution-submit');

      await waitFor(() =>
        expect(api.createSolution).toHaveBeenCalledWith('Permit intake', 'Applicants submit permits for staff review.'),
      );
    });

    it('closes the modal without creating when cancelled', () => {
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-cancel');

      expect(container.querySelector('goa-modal[testid="new-solution-modal"]')?.getAttribute('open')).toBeNull();
      expect(api.createSolution).not.toHaveBeenCalled();
    });

    it('clears the name field after creating', async () => {
      api.createSolution.mockResolvedValue(permitIntake);
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-submit');

      await waitFor(() =>
        expect(container.querySelector('goa-input[testid="new-solution-name"]')?.getAttribute('value')).toBe(''),
      );
    });

    it('stays on the page when creation fails', async () => {
      api.createSolution.mockRejectedValue(new Error('Network Error'));
      const { container } = render(<Solutions onSelect={onSelect} />);
      click(container, 'new-solution');
      type(container, 'goa-input[testid="new-solution-name"]', 'Permit intake');

      click(container, 'new-solution-submit');

      await waitFor(() => expect(api.createSolution).toHaveBeenCalled());
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('delete solution', () => {
    it('is closed initially', async () => {
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(false);
    });

    it('opens the confirm modal when delete is clicked', async () => {
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      click(container, 'delete-solution-solution-1');

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(true);
      expect(container.querySelector('goa-modal')?.textContent).toContain('Permit intake');
    });

    it('closes without deleting when cancelled', async () => {
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');
      click(container, 'delete-solution-solution-1');

      click(container, 'delete-solution-cancel');

      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(false);
      expect(api.deleteSolution).not.toHaveBeenCalled();
    });

    it('deletes the solution and reloads the list', async () => {
      api.deleteSolution.mockResolvedValue(undefined);
      api.listSolutions.mockResolvedValueOnce([permitIntake]).mockResolvedValueOnce([]);
      const { container, findByText, findByTestId } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');
      click(container, 'delete-solution-solution-1');

      click(container, 'delete-solution-confirm');

      await waitFor(() => expect(api.deleteSolution).toHaveBeenCalledWith('solution-1'));
      expect(await findByTestId('no-solutions')).toBeTruthy();
    });

    it('stays open when deletion fails', async () => {
      api.deleteSolution.mockRejectedValue(new Error('Network Error'));
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');
      click(container, 'delete-solution-solution-1');

      click(container, 'delete-solution-confirm');

      await waitFor(() => expect(api.deleteSolution).toHaveBeenCalled());
      expect(container.querySelector('goa-modal')?.hasAttribute('open')).toBe(true);
    });
  });

  describe('search', () => {
    it('filters the list by name', async () => {
      api.listSolutions.mockResolvedValue([permitIntake, makeSolution('solution-2', 'Grant application')]);
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      type(container, 'goa-input[testid="solutions-search"]', 'grant');

      await waitFor(() => expect(container.querySelector('[data-testid="select-solution-solution-2"]')).not.toBeNull());
      expect(container.querySelector('[data-testid="select-solution-solution-1"]')).toBeNull();
    });

    it('shows a no-match message when nothing matches the search', async () => {
      const { container, findByText, findByTestId } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      type(container, 'goa-input[testid="solutions-search"]', 'nothing matches this');

      expect(await findByTestId('no-solutions-match')).toBeTruthy();
      expect(container.querySelector('goa-table')).toBeNull();
    });
  });

  describe('sorting', () => {
    it('does not sort by default', async () => {
      api.listSolutions.mockResolvedValue([makeSolution('solution-2', 'Zebra'), makeSolution('solution-3', 'Alpha')]);
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Zebra');

      const names = Array.from(container.querySelectorAll('[data-testid^="select-solution-"]')).map(
        (n) => n.textContent,
      );
      expect(names).toEqual(['Zebra', 'Alpha']);
    });

    it('sorts by name when the header is clicked', async () => {
      api.listSolutions.mockResolvedValue([makeSolution('solution-2', 'Zebra'), makeSolution('solution-3', 'Alpha')]);
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Zebra');

      fireEvent(
        container.querySelector('goa-table[testid="solutions-list"]') as Element,
        new CustomEvent('_sort', { detail: { sortBy: 'name', sortDir: 1 } }),
      );

      const names = Array.from(container.querySelectorAll('[data-testid^="select-solution-"]')).map(
        (n) => n.textContent,
      );
      expect(names).toEqual(['Alpha', 'Zebra']);
    });
  });

  describe('pagination', () => {
    const many = Array.from({ length: 7 }, (_, i) => makeSolution(`solution-${i}`, `Solution ${i}`));

    it('shows only a page of results and disables previous on the first page', async () => {
      api.listSolutions.mockResolvedValue(many);
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Solution 0');

      expect(container.querySelector('[testid="solutions-prev-page"]')?.getAttribute('disabled')).toBe('true');
      expect(container.querySelector('[data-testid="solutions-page-label"]')?.textContent).toContain('Page 1 of');
    });

    it('moves to the next page and back', async () => {
      api.listSolutions.mockResolvedValue(many);
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Solution 0');

      click(container, 'solutions-next-page');

      await waitFor(() =>
        expect(container.querySelector('[data-testid="solutions-page-label"]')?.textContent).toContain('Page 2 of'),
      );

      click(container, 'solutions-prev-page');

      await waitFor(() =>
        expect(container.querySelector('[data-testid="solutions-page-label"]')?.textContent).toContain('Page 1 of'),
      );
    });
  });

  describe('row exports', () => {
    it('downloads the solution as JSON', async () => {
      api.exportSolution.mockResolvedValue({ id: 'solution-1' });
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      click(container, 'export-json-solution-solution-1');

      await waitFor(() => expect(api.exportSolution).toHaveBeenCalledWith('solution-1'));
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake.json',
        JSON.stringify({ id: 'solution-1' }, null, 2),
        'application/json',
      );
    });

    it('downloads the solution as a markdown report labelled with its version', async () => {
      api.exportSolution.mockResolvedValue({ version: 2, unsavedChanges: true });
      const { container, findByText } = render(<Solutions onSelect={onSelect} />);
      await findByText('Permit intake');

      click(container, 'export-report-solution-solution-1');

      await waitFor(() => expect(api.exportSolution).toHaveBeenCalledWith('solution-1'));
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake.md',
        expect.stringContaining('solution-version: 2 (unsaved changes)\n'),
        'text/markdown',
      );
    });
  });
});
