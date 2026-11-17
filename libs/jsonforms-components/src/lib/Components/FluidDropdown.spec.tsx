import { act, render } from '@testing-library/react';
import { GoabDropdownItem } from '@abgov/react-components-ds1';
import { FluidDropdown } from './FluidDropdown';

type ResizeCallback = (entries: { contentRect: { width: number } }[]) => void;

describe('FluidDropdown', () => {
  let resize: ResizeCallback | undefined;
  const disconnect = jest.fn();
  const originalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    resize = undefined;
    disconnect.mockClear();
    global.ResizeObserver = jest.fn((callback: ResizeCallback) => {
      resize = callback;
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect };
    }) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  const renderDropdown = (width?: string) =>
    render(
      <FluidDropdown name="colour" testId="colour" width={width} onChange={jest.fn()}>
        <GoabDropdownItem value="red" label="Red" />
      </FluidDropdown>,
    );

  const dropdownWidth = (baseElement: HTMLElement) =>
    baseElement.querySelector('goa-dropdown')?.getAttribute('width');

  it('follows its container when the container is resized', () => {
    const { baseElement } = renderDropdown('100%');

    act(() => resize?.([{ contentRect: { width: 592.625 } }]));
    expect(dropdownWidth(baseElement)).toBe('592px');

    act(() => resize?.([{ contentRect: { width: 343 } }]));
    expect(dropdownWidth(baseElement)).toBe('343px');
  });

  it('applies the configured percentage to the container width', () => {
    const { baseElement } = renderDropdown('50%');

    act(() => resize?.([{ contentRect: { width: 600 } }]));
    expect(dropdownWidth(baseElement)).toBe('300px');
  });

  it('keeps the percentage until the container has been measured', () => {
    const { baseElement } = renderDropdown('100%');

    act(() => resize?.([{ contentRect: { width: 0 } }]));
    expect(dropdownWidth(baseElement)).toBe('100%');
  });

  it('passes fixed widths through without observing', () => {
    const { baseElement } = renderDropdown('250px');

    expect(global.ResizeObserver).not.toHaveBeenCalled();
    expect(dropdownWidth(baseElement)).toBe('250px');
  });

  it('stops observing when unmounted', () => {
    const { unmount } = renderDropdown('100%');

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('keeps the percentage when ResizeObserver is unavailable', () => {
    global.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    const { baseElement } = renderDropdown('100%');

    expect(dropdownWidth(baseElement)).toBe('100%');
  });
});
