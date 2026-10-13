import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { DiscoveryPanel } from './DiscoveryPanel';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { DiscoveryState, Solution } from './model';

const discovery = (overrides: Partial<DiscoveryState> = {}): DiscoveryState => ({
  messages: [
    { role: 'assistant', content: 'Who are the users?', at: '2026-03-01T10:00:00.000Z' },
    { role: 'user', content: 'Inspectors.', at: '2026-03-01T10:01:00.000Z' },
  ],
  confidence: 30,
  threshold: 50,
  factors: [],
  ready: false,
  mode: 'ai',
  updatedOn: '2026-03-01T10:01:00.000Z',
  ...overrides,
});

const solution = (d?: DiscoveryState, blueprint = false): Solution =>
  ({
    id: 'solution-1',
    name: 'Permit intake',
    scenario: 'new',
    status: 'draft',
    createdByName: 'Pat',
    updatedOn: '2026-03-01T10:00:00.000Z',
    revision: 1,
    state: {
      problemStatement: 'Permits',
      concepts: [],
      decisions: [],
      questions: [],
      hypotheses: [],
      specialists: [],
      nextSteps: [],
      discovery: d,
      blueprint: blueprint ? ({ generatedOn: '2026-03-01T10:00:00.000Z' } as never) : undefined,
    },
  }) as Solution;

const goa = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;

const click = (container: HTMLElement, testId: string) =>
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));

const type = (container: HTMLElement, value: string) =>
  fireEvent(container.querySelector('goa-textarea[testid="discovery-input"]') as Element, new CustomEvent('_change', { detail: { value } }));

describe('DiscoveryPanel', () => {
  it('starts discovery when none exists', async () => {
    const started = solution(discovery());
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(started) });
    const onSolutionChange = jest.fn();
    const { container, getByTestId } = render(
      <DiscoveryPanel solution={solution()} api={api} mode="ai" onSolutionChange={onSolutionChange} />,
    );
    expect(getByTestId('discovery-empty')).toBeTruthy();
    expect(container.querySelector('goa-textarea')).toBeNull();

    click(container, 'discovery-start');
    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
    await waitFor(() => expect(onSolutionChange).toHaveBeenCalledWith(started));
    expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true });
    expect(api.blueprint).not.toHaveBeenCalled();
    expect(container.querySelector('goa-circular-progress')).toBeNull();
  });

  it('renders the thread and warning', () => {
    const { container, getByTestId } = render(
      <DiscoveryPanel solution={solution(discovery({ warning: 'Rules used' }))} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(goa(container, 'discovery-warning').textContent).toContain('Rules used');
    expect(goa(container, 'discovery-message-0').getAttribute('heading')).toBe('Planner');
    expect(goa(container, 'discovery-message-1').getAttribute('heading')).toBe('You');
    expect(container.querySelector('goa-textarea')?.getAttribute('placeholder')).toBe('Type your answers here');
    expect(container.querySelector('goa-button[testid="discovery-force"]')).not.toBeNull();
  });

  it('sends a reply when not ready', async () => {
    const next = solution(discovery());
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(next) });
    const onSolutionChange = jest.fn();
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={api} mode="rules" onSolutionChange={onSolutionChange} />);

    expect(container.querySelector('goa-button[testid="discovery-send"]')?.getAttribute('disabled')).toBe('true');
    type(container, '  Staff only ');
    click(container, 'discovery-send');

    await waitFor(() => expect(onSolutionChange).toHaveBeenCalledWith(next));
    expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'rules', message: 'Staff only' });
    expect(container.querySelector('goa-textarea')?.getAttribute('value')).toBe('');
  });

  it('forces the solution with and without a message', async () => {
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(solution(discovery())) });
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={jest.fn()} />);

    click(container, 'discovery-force');
    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', force: true }));

    type(container, 'More');
    click(container, 'discovery-force');
    await waitFor(() => expect(api.discovery).toHaveBeenLastCalledWith('solution-1', { mode: 'ai', force: true, message: 'More' }));
  });

  it('restarts discovery', async () => {
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(solution(discovery())) });
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={jest.fn()} />);
    click(container, 'discovery-restart');
    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true }));
  });

  it('generates the blueprint when first ready', async () => {
    const ready = solution(discovery({ ready: true }));
    const final = solution(discovery({ ready: true }), true);
    const api = createMockApi({
      discovery: jest.fn().mockResolvedValue(ready),
      blueprint: jest.fn().mockResolvedValue(final),
    });
    const onSolutionChange = jest.fn();
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={onSolutionChange} />);
    click(container, 'discovery-force');
    await waitFor(() => expect(onSolutionChange).toHaveBeenLastCalledWith(final));
    expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai' });
  });

  it('regenerates the blueprint after a refining message when ready', async () => {
    const ready = solution(discovery({ ready: true }), true);
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(ready), blueprint: jest.fn().mockResolvedValue(ready) });
    const { container } = render(<DiscoveryPanel solution={ready} api={api} mode="ai" onSolutionChange={jest.fn()} />);
    expect(container.querySelector('goa-textarea')?.getAttribute('placeholder')).toContain('refine');
    expect(container.querySelector('goa-button[testid="discovery-force"]')).toBeNull();
    expect(container.querySelector('goa-button[testid="discovery-send"]')?.textContent).toBe('Send & refine solution');

    type(container, 'Also email');
    click(container, 'discovery-send');
    await waitFor(() => expect(api.blueprint).toHaveBeenCalledTimes(1));
  });

  it('skips the blueprint when ready, one exists, and no message was sent', async () => {
    const ready = solution(discovery({ ready: true }), true);
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(ready) });
    const onSolutionChange = jest.fn();
    const { container } = render(<DiscoveryPanel solution={ready} api={api} mode="ai" onSolutionChange={onSolutionChange} />);
    click(container, 'discovery-restart');
    await waitFor(() => expect(onSolutionChange).toHaveBeenCalledWith(ready));
    expect(api.blueprint).not.toHaveBeenCalled();
  });

  it('resets busy state when the api fails', async () => {
    const api = createMockApi({ discovery: jest.fn().mockRejectedValue(new Error('boom')) });
    const onSolutionChange = jest.fn();
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={onSolutionChange} />);
    click(container, 'discovery-restart');
    expect(container.querySelector('goa-button[testid="discovery-restart"]')?.getAttribute('disabled')).toBe('true');
    await waitFor(() => expect(container.querySelector('goa-circular-progress')).toBeNull());
    expect(onSolutionChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<DiscoveryPanel solution={solution(discovery())} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />);
    await expectNoA11yViolations(container);
  });
});
