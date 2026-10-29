import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { VersionsModal } from './VersionsModal';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { download } from './utils';
import { Solution, SolutionVersionSummary } from './model';

jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), download: jest.fn() }));

const goa = (container: HTMLElement, testId: string) =>
  container.querySelector(`[testid="${testId}"], [data-testid="${testId}"]`) as Element;
const click = (container: HTMLElement, testId: string) => fireEvent(goa(container, testId), new CustomEvent('_click'));
const type = (container: HTMLElement, testId: string, value: string) =>
  fireEvent(goa(container, testId), new CustomEvent('_change', { detail: { name: 'x', value } }));

const solution: Solution = {
  id: 'solution-1',
  name: 'Permit intake',
  scenario: 'new',
  status: 'draft',
  createdByName: 'Pat',
  updatedOn: '2026-03-03T10:00:00.000Z',
  version: 2,
  state: {
    problemStatement: 'Applicants submit permits for staff review.',
    concepts: [],
    decisions: [],
    questions: [],
    hypotheses: [],
    specialists: [],
    nextSteps: [],
  },
};

const savedAt = (month: number, day: number, hour: number, minute: number) =>
  new Date(2026, month - 1, day, hour, minute).toISOString();

const versions: SolutionVersionSummary[] = [
  { number: 2, name: 'Pilot', createdOn: savedAt(3, 2, 14, 5) },
  { number: 1, name: 'Version 1', createdOn: savedAt(3, 1, 0, 30) },
];

describe('VersionsModal', () => {
  let api: MockPlannerApi;
  const onClose = jest.fn();
  const onRenamed = jest.fn();

  const renderModal = () =>
    render(
      <VersionsModal open solution={solution} api={api} versions={versions} onClose={onClose} onRenamed={onRenamed} />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    api = createMockApi({
      renameVersion: jest.fn().mockResolvedValue({ ...versions[0], name: 'Pilot release' }),
      exportVersion: jest.fn().mockResolvedValue({ ...solution, version: 2, changedSections: ['Problem statement'] }),
    });
  });

  it('is wide enough for the name editor and export buttons', () => {
    const { container } = renderModal();

    expect(goa(container, 'versions-modal').getAttribute('maxwidth')).toBe('960px');
  });

  it('lists each version with its name and local save time in the given order', () => {
    const { container } = renderModal();

    const rows = Array.from(container.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td'))
        .slice(0, 3)
        .map((cell) => cell.textContent),
    );
    expect(rows).toEqual([
      ['2', 'Pilot', '03-02-2026, 2:05 PM'],
      ['1', 'Version 1', '03-01-2026, 12:30 AM'],
    ]);
  });

  it('renames a version with the trimmed name', async () => {
    const { container } = renderModal();

    click(container, 'rename-version-2');
    expect(goa(container, 'version-name-input').getAttribute('value')).toBe('Pilot');
    type(container, 'version-name-input', '  Pilot release  ');
    click(container, 'version-name-save');

    await waitFor(() => expect(onRenamed).toHaveBeenCalled());
    expect(api.renameVersion).toHaveBeenCalledWith('solution-1', 2, 'Pilot release');
    expect(goa(container, 'version-name-input')).toBeNull();
  });

  it('right-aligns cancel then save below the name input', () => {
    const { container } = renderModal();

    click(container, 'rename-version-2');

    const input = goa(container, 'version-name-input');
    const actions = goa(container, 'version-name-actions');
    const cancel = goa(container, 'version-name-cancel');
    const save = goa(container, 'version-name-save');
    expect(actions.getAttribute('alignment')).toBe('end');
    expect(actions.contains(cancel) && actions.contains(save)).toBe(true);
    expect(actions.contains(input)).toBe(false);
    expect(input.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cancel.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the name editor open when renaming fails', async () => {
    api.renameVersion.mockRejectedValue(new Error('x'));
    const { container } = renderModal();

    click(container, 'rename-version-2');
    click(container, 'version-name-save');

    await waitFor(() => expect(api.renameVersion).toHaveBeenCalled());
    expect(onRenamed).not.toHaveBeenCalled();
    expect(goa(container, 'version-name-input')).not.toBeNull();
  });

  it('cancels a rename without saving', () => {
    const { container } = renderModal();

    click(container, 'rename-version-2');
    click(container, 'version-name-cancel');

    expect(goa(container, 'version-name-input')).toBeNull();
    expect(api.renameVersion).not.toHaveBeenCalled();
  });

  it.each([
    ['json', 'planner-permit-intake-v2.json', expect.stringContaining('"version": 2'), 'application/json'],
    ['report', 'planner-permit-intake-v2.md', expect.stringContaining('solution-version: 2\n'), 'text/markdown'],
    [
      'harness',
      'planner-permit-intake-v2-harness.md',
      expect.stringContaining('solution-version: 2`'),
      'text/markdown',
    ],
  ])(
    'downloads the %s export of a saved version named with its version number',
    async (kind, filename, content, mime) => {
      const { container } = renderModal();

      click(container, `version-${kind}-2`);

      await waitFor(() => expect(download).toHaveBeenCalledWith(filename, content, mime));
      expect(api.exportVersion).toHaveBeenCalledWith('solution-1', 2);
    },
  );

  it('points the harness instructions at the versioned plan and harness file names', async () => {
    const { container } = renderModal();

    click(container, 'version-harness-2');

    await waitFor(() => expect(download).toHaveBeenCalled());
    const md = (download as jest.Mock).mock.calls[0][1];
    expect(md).toContain('`planner-permit-intake-v2.md`: the plan, solution version 2;');
    expect(md).toContain('`planner-permit-intake-v2-harness.md`: these instructions.');
    expect(md).toContain('otherwise `planner-permit-intake-v2.md` next to this file');
    expect(md).toContain('`docs/bundle/planner-permit-intake.md`');
  });

  it('closes', () => {
    const { container } = renderModal();

    click(container, 'versions-close');

    expect(onClose).toHaveBeenCalled();
  });

  it('passes accessibility checks', async () => {
    const { container } = renderModal();
    await expectNoA11yViolations(container);
  });
});
