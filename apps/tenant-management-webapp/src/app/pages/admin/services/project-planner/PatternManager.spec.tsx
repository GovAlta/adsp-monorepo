import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { PatternManager } from './PatternManager';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { expectNoA11yViolations } from './testing/axe';
import { BusinessPattern } from './model';

describe('PatternManager', () => {
  const builtIn: BusinessPattern = {
    id: 'case-management',
    source: 'built-in',
    name: 'Case Management',
    description: 'Manage records moving through a lifecycle.',
    domainLanguage: ['case'],
    commonFeatures: ['Intake form'],
    strongSignals: [{ description: 'Cases are assigned', keywords: ['case', 'assign'] }],
    weakSignals: [{ description: 'Just a form', keywords: ['form'] }],
    serviceMappings: [{ service: 'form-service', reason: 'Intake forms.' }],
    clarifyingQuestions: ['Is it long-lived?'],
    assumptions: ['Records persist'],
    knownUnknowns: ['Volume'],
  };
  const customized: BusinessPattern = { ...builtIn, id: 'permitting', source: 'customized', name: 'Permitting' };
  const custom: BusinessPattern = {
    id: 'my-pattern',
    source: 'custom',
    name: 'My pattern',
    description: 'Mine.',
    domainLanguage: ['x'],
    serviceMappings: [{ service: 'file-service', reason: 'Files.' }],
    clarifyingQuestions: [],
  };

  let api: MockPlannerApi;

  const click = (container: HTMLElement, testId: string) =>
    fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));
  const setField = (container: HTMLElement, key: string, value: string) =>
    fireEvent(
      container.querySelector(`goa-textarea[testid="pattern-field-${key}"]`) as Element,
      new CustomEvent('_change', { detail: { name: `pattern-${key}`, value } }),
    );
  const fillValid = (container: HTMLElement) => {
    setField(container, 'name', ' New one ');
    setField(container, 'description', 'Purpose');
    setField(container, 'domainLanguage', 'term\n\n other ');
    setField(container, 'strongSignals', 'Signal | one, two');
    setField(container, 'weakSignals', 'Weak | w');
    setField(container, 'serviceMappings', 'form-service: Intake: forms');
    setField(container, 'clarifyingQuestions', 'Why?');
  };
  const renderList = async (canEdit = true) => {
    const result = render(<PatternManager api={api} canEdit={canEdit} />);
    await waitFor(() => expect(result.container.querySelector('goa-table')).not.toBeNull());
    return result;
  };
  const fieldError = (container: HTMLElement, label: string) =>
    container.querySelector(`goa-form-item[label="${label}"]`)?.getAttribute('error');

  beforeEach(() => {
    api = createMockApi();
    api.listPatterns.mockResolvedValue([builtIn, customized, custom]);
    api.createPattern.mockResolvedValue(custom);
    api.updatePattern.mockResolvedValue(custom);
    api.deletePattern.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading indicator while patterns load', () => {
    api.listPatterns.mockReturnValue(new Promise(() => undefined));

    const { container } = render(<PatternManager api={api} />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('lists patterns with description, detail sections, services and source badges', async () => {
    const { container } = await renderList();

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(container.textContent).toContain('form-service: Intake forms.');
    expect(container.querySelector('goa-badge[testid="pattern-source-case-management"]')?.getAttribute('content')).toBe(
      'Built-in',
    );
    expect(container.querySelector('goa-badge[testid="pattern-source-permitting"]')?.getAttribute('content')).toBe(
      'Customized',
    );
    expect(container.querySelector('goa-badge[testid="pattern-source-my-pattern"]')?.getAttribute('content')).toBe(
      'Custom',
    );
    expect(container.querySelectorAll('goa-details[heading="Known unknowns"]')).toHaveLength(2);
    expect(container.querySelectorAll('goa-details[heading="Clarifying questions"]')).toHaveLength(2);
  });

  it('treats patterns without a source as built-in', async () => {
    api.listPatterns.mockResolvedValue([{ ...builtIn, source: undefined }]);

    const { container } = await renderList();

    expect(container.querySelector('goa-badge[testid="pattern-source-case-management"]')?.getAttribute('content')).toBe(
      'Built-in',
    );
  });

  it('shows an empty table when loading fails', async () => {
    api.listPatterns.mockRejectedValue(new Error('x'));

    const { container } = await renderList();

    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('hides editing controls without edit permission', async () => {
    const { container } = await renderList(false);

    expect(container.querySelector('goa-button[testid="pattern-new"]')).toBeNull();
    expect(container.querySelector('goa-button[testid="pattern-edit-permitting"]')).toBeNull();
    expect(container.querySelectorAll('th')).toHaveLength(3);
  });

  it('offers delete only for non built-in patterns', async () => {
    const { container } = await renderList();

    expect(container.querySelector('goa-button[testid="pattern-delete-case-management"]')).toBeNull();
    expect(container.querySelector('goa-button[testid="pattern-delete-permitting"]')?.textContent).toBe('Revert');
    expect(container.querySelector('goa-button[testid="pattern-delete-my-pattern"]')?.textContent).toBe('Delete');
  });

  it('shows validation errors and does not save an empty pattern', async () => {
    const { container, getByTestId } = await renderList();

    click(container, 'pattern-new');
    expect(getByTestId('pattern-editor-heading').textContent).toBe('New pattern');
    click(container, 'pattern-save');

    await waitFor(() => expect(fieldError(container, 'Business pattern (name)')).toBe('Name is required.'));
    expect(fieldError(container, 'Purpose')).toBe('Purpose is required.');
    expect(fieldError(container, 'Common domain language')).toBe('Add at least one domain term.');
    expect(fieldError(container, 'Strong confidence signals')).toBe('Add at least one strong signal.');
    expect(fieldError(container, 'Likely ADSP service mappings')).toBe('Add at least one service mapping.');
    expect(api.createPattern).not.toHaveBeenCalled();
  });

  it('flags malformed signals and mappings', async () => {
    const { container } = await renderList();
    click(container, 'pattern-new');

    setField(container, 'strongSignals', 'no keywords here');
    setField(container, 'weakSignals', 'weak | ');
    setField(container, 'serviceMappings', 'service-without-reason');
    click(container, 'pattern-save');

    await waitFor(() => expect(fieldError(container, 'Strong confidence signals')).toContain('at least one keyword'));
    expect(fieldError(container, 'Weak or misleading signals')).toContain('at least one keyword');
    expect(fieldError(container, 'Likely ADSP service mappings')).toContain('service-name: reason');
  });

  it('flags values over the service limits', async () => {
    const { container } = await renderList();
    click(container, 'pattern-new');

    setField(container, 'name', 'n'.repeat(101));
    setField(container, 'description', 'd'.repeat(2001));
    setField(container, 'domainLanguage', Array.from({ length: 101 }, (_, i) => `t${i}`).join('\n'));
    setField(container, 'strongSignals', Array.from({ length: 51 }, (_, i) => `s${i} | k`).join('\n'));
    setField(container, 'serviceMappings', Array.from({ length: 31 }, (_, i) => `svc${i}: r`).join('\n'));
    setField(container, 'assumptions', Array.from({ length: 51 }, (_, i) => `a${i}`).join('\n'));
    click(container, 'pattern-save');

    await waitFor(() => expect(fieldError(container, 'Business pattern (name)')).toContain('100'));
    expect(fieldError(container, 'Purpose')).toContain('2000');
    expect(fieldError(container, 'Common domain language')).toContain('100');
    expect(fieldError(container, 'Strong confidence signals')).toContain('50');
    expect(fieldError(container, 'Likely ADSP service mappings')).toContain('30');
    expect(fieldError(container, 'Assumptions')).toContain('50');
  });

  it('creates a pattern from the form and reloads the list', async () => {
    const { container } = await renderList();
    click(container, 'pattern-new');
    fillValid(container);

    click(container, 'pattern-save');

    await waitFor(() => expect(api.createPattern).toHaveBeenCalled());
    expect(api.createPattern).toHaveBeenCalledWith({
      name: 'New one',
      description: 'Purpose',
      domainLanguage: ['term', 'other'],
      commonFeatures: [],
      strongSignals: [{ description: 'Signal', keywords: ['one', 'two'] }],
      weakSignals: [{ description: 'Weak', keywords: ['w'] }],
      serviceMappings: [{ service: 'form-service', reason: 'Intake: forms' }],
      clarifyingQuestions: ['Why?'],
      assumptions: [],
      knownUnknowns: [],
    });
    await waitFor(() => expect(container.querySelector('goa-table')).not.toBeNull());
    expect(api.listPatterns).toHaveBeenCalledTimes(2);
  });

  it('keeps the form open when saving fails', async () => {
    api.createPattern.mockRejectedValue(new Error('invalid'));
    const { container } = await renderList();
    click(container, 'pattern-new');
    fillValid(container);

    click(container, 'pattern-save');

    await waitFor(() => expect(api.createPattern).toHaveBeenCalled());
    await waitFor(() =>
      expect(container.querySelector('goa-button[testid="pattern-save"]')?.getAttribute('disabled')).toBeNull(),
    );
    expect(container.querySelector('goa-textarea[testid="pattern-field-name"]')).not.toBeNull();
  });

  it('edits an existing pattern with its fields prefilled', async () => {
    const { container, getByTestId } = await renderList();

    click(container, 'pattern-edit-case-management');

    expect(getByTestId('pattern-editor-heading').textContent).toBe('Edit pattern: case-management');
    const value = (key: string) =>
      container.querySelector(`goa-textarea[testid="pattern-field-${key}"]`)?.getAttribute('value');
    expect(value('name')).toBe('Case Management');
    expect(value('strongSignals')).toBe('Cases are assigned | case, assign');
    expect(value('serviceMappings')).toBe('form-service: Intake forms.');

    setField(container, 'description', 'Updated');
    click(container, 'pattern-save');

    await waitFor(() => expect(api.updatePattern).toHaveBeenCalled());
    expect(api.updatePattern.mock.calls[0][0]).toBe('case-management');
    expect(api.updatePattern.mock.calls[0][1].description).toBe('Updated');
  });

  it('prefills an empty form when the pattern has no optional parts', async () => {
    api.listPatterns.mockResolvedValue([custom]);
    const { container } = await renderList();

    click(container, 'pattern-edit-my-pattern');

    expect(container.querySelector('goa-textarea[testid="pattern-field-weakSignals"]')?.getAttribute('value')).toBe('');
  });

  it('cancels editing', async () => {
    const { container } = await renderList();
    click(container, 'pattern-new');

    click(container, 'pattern-cancel');

    expect(container.querySelector('goa-table')).not.toBeNull();
    expect(api.createPattern).not.toHaveBeenCalled();
  });

  it('confirms before deleting a custom pattern', async () => {
    const { container } = await renderList();

    click(container, 'pattern-delete-my-pattern');

    const modal = container.querySelector('goa-modal[testid="pattern-delete-modal"]');
    expect(modal?.getAttribute('heading')).toBe('Delete this pattern?');
    expect(modal?.textContent).toContain('My pattern');
    expect(api.deletePattern).not.toHaveBeenCalled();

    click(container, 'pattern-delete-confirm');

    await waitFor(() => expect(api.deletePattern).toHaveBeenCalledWith('my-pattern'));
    await waitFor(() => expect(container.querySelector('goa-modal')).toBeNull());
    expect(api.listPatterns).toHaveBeenCalledTimes(2);
  });

  it('explains that reverting a customized pattern restores the built-in version', async () => {
    const { container } = await renderList();

    click(container, 'pattern-delete-permitting');

    const modal = container.querySelector('goa-modal[testid="pattern-delete-modal"]');
    expect(modal?.getAttribute('heading')).toBe('Revert this pattern?');
    expect(modal?.textContent).toContain('built-in definition');
    click(container, 'pattern-delete-confirm');
    await waitFor(() => expect(api.deletePattern).toHaveBeenCalledWith('permitting'));
  });

  it('cancels a delete from the modal button and the close event', async () => {
    const { container } = await renderList();

    click(container, 'pattern-delete-my-pattern');
    click(container, 'pattern-delete-cancel');
    expect(container.querySelector('goa-modal')).toBeNull();

    click(container, 'pattern-delete-my-pattern');
    fireEvent(container.querySelector('goa-modal') as Element, new CustomEvent('_close'));
    expect(container.querySelector('goa-modal')).toBeNull();
    expect(api.deletePattern).not.toHaveBeenCalled();
  });

  it('closes the modal when deleting fails', async () => {
    api.deletePattern.mockRejectedValue(new Error('nope'));
    const { container } = await renderList();

    click(container, 'pattern-delete-my-pattern');
    click(container, 'pattern-delete-confirm');

    await waitFor(() => expect(container.querySelector('goa-modal')).toBeNull());
  });

  it('has no accessibility violations in the list', async () => {
    const { container } = await renderList();

    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations in the editor', async () => {
    const { container } = await renderList();
    click(container, 'pattern-new');

    await expectNoA11yViolations(container);
  });
});
