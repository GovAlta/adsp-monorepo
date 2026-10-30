import type { User } from '@abgov/adsp-service-sdk';
import { RequestContext } from '@mastra/core/request-context';
import { withContextualInstructions } from './contextualInstructions';

describe('withContextualInstructions', () => {
  const createRequestContext = (user?: Partial<User>) => {
    const requestContext = new RequestContext<Record<string, unknown>>();
    if (user) {
      requestContext.set('user', user);
    }
    return requestContext;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('puts the agent instructions before the request context', () => {
    const resolve = withContextualInstructions('Agent instructions.');

    const prompt = resolve({ requestContext: createRequestContext({ name: 'Jane Doe' }) });

    expect(prompt.indexOf('Agent instructions.')).toBeLessThan(prompt.indexOf('Request context:'));
    expect(prompt).toMatch(/User: Jane Doe$/);
  });

  it('keeps the same prompt prefix across requests so providers can cache it', () => {
    const resolve = withContextualInstructions('Agent instructions.');
    jest.useFakeTimers().setSystemTime(new Date('2026-01-05T09:00:00.000Z'));
    const first = resolve({ requestContext: createRequestContext({ name: 'Jane Doe' }) });
    jest.setSystemTime(new Date('2026-01-06T10:30:00.000Z'));

    const second = resolve({ requestContext: createRequestContext({ name: 'John Smith' }) });

    const prefix = first.slice(0, first.indexOf('Request context:'));
    expect(second.startsWith(prefix)).toBe(true);
    expect(prefix).toContain('Agent instructions.');
  });

  it('includes the current date, time and day of the week', () => {
    // Midday UTC, so the local day of the week matches the UTC date in any test machine time zone.
    jest.useFakeTimers().setSystemTime(new Date('2026-01-05T12:00:00.000Z'));
    const resolve = withContextualInstructions('Agent instructions.');

    const prompt = resolve({ requestContext: createRequestContext({ name: 'Jane Doe' }) });

    expect(prompt).toContain('Current date: 2026-01-05 (Monday)');
    expect(prompt).toContain('Current time: 2026-01-05T12:00:00.000Z');
  });

  it('names the user generically when there is no user', () => {
    const resolve = withContextualInstructions('Agent instructions.');

    const prompt = resolve({ requestContext: createRequestContext() });

    expect(prompt).toMatch(/User: User$/);
  });

  it('includes the tool call contract', () => {
    const resolve = withContextualInstructions('Agent instructions.');

    const prompt = resolve({ requestContext: createRequestContext({ name: 'Jane Doe' }) });

    expect(prompt.startsWith('Tool call contract:')).toBe(true);
  });
});
