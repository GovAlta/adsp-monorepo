import { act, renderHook } from '@testing-library/react';
import { useBusy } from './useBusy';

describe('useBusy', () => {
  it('is busy only while the action runs', async () => {
    const { result } = renderHook(() => useBusy());
    let finish: () => void;
    const action = () => new Promise<void>((resolve) => (finish = resolve));

    let running: Promise<void>;
    act(() => {
      running = result.current[1](action);
    });
    expect(result.current[0]).toBe(true);

    await act(async () => {
      finish();
      await running;
    });
    expect(result.current[0]).toBe(false);
  });

  it('swallows a failed action and clears busy', async () => {
    const { result } = renderHook(() => useBusy());

    await act(() => result.current[1](() => Promise.reject(new Error('failed'))));

    expect(result.current[0]).toBe(false);
  });

  it('keeps the same run function across renders', () => {
    const { result, rerender } = renderHook(() => useBusy());
    const run = result.current[1];

    rerender();

    expect(result.current[1]).toBe(run);
  });
});
