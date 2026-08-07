import { act, renderHook } from '@testing-library/react';
import { useDebouncedCommit } from './useDebouncedCommit';

describe('useDebouncedCommit', () => {
  it('starts from the value in the form data', () => {
    const { result } = renderHook(() => useDebouncedCommit('start', jest.fn()));

    expect(result.current.value).toBe('start');
  });

  it('exposes each keystroke immediately so the input never renders a stale value', () => {
    const { result } = renderHook(() => useDebouncedCommit('', jest.fn()));

    act(() => result.current.setValue('D'));
    expect(result.current.value).toBe('D');

    act(() => result.current.setValue('DE'));
    expect(result.current.value).toBe('DE');
  });

  it('adopts external changes once there is nothing pending', () => {
    const { result, rerender } = renderHook(({ external }) => useDebouncedCommit(external, jest.fn()), {
      initialProps: { external: 'first' },
    });

    rerender({ external: 'second' });

    expect(result.current.value).toBe('second');
  });

  it('does not commit a value the user never touched', () => {
    const commit = jest.fn();
    const { rerender } = renderHook(({ external }) => useDebouncedCommit(external, commit), {
      initialProps: { external: 'untouched' },
    });

    rerender({ external: 'changed elsewhere' });

    expect(commit).not.toHaveBeenCalled();
  });

  it('flushes pending edits on demand, and only once', () => {
    const commit = jest.fn();
    const { result } = renderHook(() => useDebouncedCommit({ city: '' }, commit));

    act(() => result.current.setValue({ city: 'Calgary' }));
    act(() => result.current.flush());

    expect(commit).toHaveBeenCalledWith({ city: 'Calgary' });

    commit.mockClear();
    act(() => result.current.flush());
    expect(commit).not.toHaveBeenCalled();
  });

  // useDebounce deliberately resolves synchronously under jest so that control specs can assert on
  // handleChange straight after an event. These cases are about what happens with the real timer.
  describe('with production debounce timing', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalWorkerId = process.env.JEST_WORKER_ID;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.JEST_WORKER_ID;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      process.env.NODE_ENV = originalNodeEnv;
      if (originalWorkerId !== undefined) {
        process.env.JEST_WORKER_ID = originalWorkerId;
      }
    });

    it('holds the commit back until typing stops, then sends the latest value once', () => {
      const commit = jest.fn();
      const { result } = renderHook(() => useDebouncedCommit('', commit, 300));

      act(() => result.current.setValue('D'));
      act(() => jest.advanceTimersByTime(100));
      act(() => result.current.setValue('DE'));
      act(() => jest.advanceTimersByTime(100));
      act(() => result.current.setValue('DEL'));

      expect(commit).not.toHaveBeenCalled();

      act(() => jest.advanceTimersByTime(300));

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith('DEL');
    });

    it('ignores data echoing back while the user has uncommitted edits', () => {
      const { result, rerender } = renderHook(({ external }) => useDebouncedCommit(external, jest.fn(), 300), {
        initialProps: { external: '' },
      });

      act(() => result.current.setValue('DELETE'));
      act(() => result.current.setValue('DELETE '));

      // The form data is still catching up with an earlier keystroke.
      rerender({ external: 'DELET' });

      expect(result.current.value).toBe('DELETE ');
    });

    it('mirrors without committing when autoCommit is off, until something flushes', () => {
      const commit = jest.fn();
      const { result } = renderHook(() => useDebouncedCommit('', commit, 300));

      act(() => result.current.setValue('123 Main', { autoCommit: false }));
      act(() => jest.advanceTimersByTime(1000));

      expect(result.current.value).toBe('123 Main');
      expect(commit).not.toHaveBeenCalled();

      act(() => result.current.flush());
      expect(commit).toHaveBeenCalledWith('123 Main');
    });

    it('still shields an autoCommit-off edit from data arriving underneath it', () => {
      const { result, rerender } = renderHook(({ external }) => useDebouncedCommit(external, jest.fn(), 300), {
        initialProps: { external: '' },
      });

      act(() => result.current.setValue('123 Main', { autoCommit: false }));
      rerender({ external: 'something else' });

      expect(result.current.value).toBe('123 Main');
    });

    it('flushes pending edits when the control unmounts', () => {
      const commit = jest.fn();
      const { result, unmount } = renderHook(() => useDebouncedCommit('', commit, 300));

      act(() => result.current.setValue('typed but not committed'));
      expect(commit).not.toHaveBeenCalled();

      unmount();

      expect(commit).toHaveBeenCalledWith('typed but not committed');
    });
  });
});
