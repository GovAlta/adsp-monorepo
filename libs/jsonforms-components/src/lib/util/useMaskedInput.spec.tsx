import { act, renderHook } from '@testing-library/react';
import { DEFAULT_PATTERNS } from './patternForm';
import { useMaskedInput } from './useMaskedInput';

describe('useMaskedInput', () => {
  it('formats progressive input as the user types', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: false,
        data: '',
        onCommit,
      }),
    );

    act(() => result.current.handleChange({ value: '4035551212' }));

    expect(result.current.value).toBe('(403) 555-1212');
  });

  it('commits the formatted value in progressive mode', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: false,
        data: '',
        onCommit,
      }),
    );

    act(() => result.current.handleChange({ value: '4035551212' }));

    expect(onCommit).toHaveBeenCalledWith('(403) 555-1212');
  });

  it('shows the in-place template for empty data after mount', () => {
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: true,
        data: '',
        onCommit: jest.fn(),
      }),
    );

    expect(result.current.value).toBe('(###) ###-####');
  });

  it('keeps the in-place template while editing a partial value', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: true,
        data: '',
        onCommit,
      }),
    );

    act(() => result.current.handleChange({ value: '40355' }));

    expect(result.current.value).toBe('(403) 55#-####');
  });

  it('commits the clean stored value in in-place mode', () => {
    const onCommit = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: true,
        data: '',
        onCommit,
      }),
    );

    act(() => result.current.handleChange({ value: '40355' }));

    expect(onCommit).toHaveBeenCalledWith('(403) 55');
  });

  it('blocks extra content keys once the in-place mask is full', () => {
    const preventDefault = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: true,
        data: '(403) 555-1212',
        onCommit: jest.fn(),
      }),
    );

    act(() => result.current.handleKeyPress({ key: '9', event: { preventDefault } as unknown as Event }));

    expect(preventDefault).toHaveBeenCalled();
  });

  it('does not block content keys when the in-place mask is not full', () => {
    const preventDefault = jest.fn();
    const { result } = renderHook(() =>
      useMaskedInput({
        mask: DEFAULT_PATTERNS.phone.mask,
        inPlace: true,
        data: '',
        onCommit: jest.fn(),
      }),
    );

    act(() => result.current.handleKeyPress({ key: '4', event: { preventDefault } as unknown as Event }));

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
