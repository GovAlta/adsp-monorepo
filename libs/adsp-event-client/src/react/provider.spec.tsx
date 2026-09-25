/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import { AdspEventClient } from '../lib/client';
import { AdspEventProvider, useAdspEvent, useAdspEventStatus } from './provider';

describe('react bindings', () => {
  let startSpy: jest.SpyInstance;
  let stopSpy: jest.SpyInstance;
  let onSpy: jest.SpyInstance;

  beforeEach(() => {
    startSpy = jest.spyOn(AdspEventClient.prototype, 'start').mockImplementation(() => undefined);
    stopSpy = jest.spyOn(AdspEventClient.prototype, 'stop').mockImplementation(() => undefined);
    onSpy = jest.spyOn(AdspEventClient.prototype, 'on');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function Consumer({ handler }: { handler: jest.Mock }) {
    useAdspEvent('test-service:test-started', handler, { retries: 1 });
    const { status } = useAdspEventStatus();
    return <span data-testid="status">{status}</span>;
  }

  it('can register handlers before starting, and stop on unmount', () => {
    const order: string[] = [];
    onSpy.mockImplementation(() => {
      order.push('on');
      return () => undefined;
    });
    startSpy.mockImplementation(() => order.push('start'));

    const { unmount } = render(
      <AdspEventProvider pushServiceUrl="https://push.test" stream="test">
        <Consumer handler={jest.fn()} />
      </AdspEventProvider>,
    );

    expect(order).toEqual(['on', 'start']);
    expect(onSpy).toHaveBeenCalledWith(['test-service:test-started'], expect.any(Function), { retries: 1 });
    expect(screen.getByTestId('status').textContent).toBe('idle');

    unmount();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('can call the latest handler without re-registering', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(
      <AdspEventProvider pushServiceUrl="https://push.test" stream="test">
        <Consumer handler={first} />
      </AdspEventProvider>,
    );
    rerender(
      <AdspEventProvider pushServiceUrl="https://push.test" stream="test">
        <Consumer handler={second} />
      </AdspEventProvider>,
    );

    expect(onSpy).toHaveBeenCalledTimes(1);
    const registered = onSpy.mock.calls[0][1];
    await registered({ eventId: 'e1' }, {});
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  it('can reflect client status', () => {
    render(
      <AdspEventProvider pushServiceUrl="https://push.test" stream="test">
        <Consumer handler={jest.fn()} />
      </AdspEventProvider>,
    );

    const client = startSpy.mock.contexts[0] as AdspEventClient;
    act(() => {
      (client as unknown as { setStatus(status: string): void }).setStatus('live');
    });
    expect(screen.getByTestId('status').textContent).toBe('live');
  });

  it('can throw when used outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Consumer handler={jest.fn()} />)).toThrow(/within an AdspEventProvider/);
  });
});
