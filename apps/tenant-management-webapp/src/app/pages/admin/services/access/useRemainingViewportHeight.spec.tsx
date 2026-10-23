import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRemainingViewportHeight } from './useRemainingViewportHeight';

const HeightProbe = ({ bottomGapPx }: { bottomGapPx: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const height = useRemainingViewportHeight(ref, bottomGapPx);
  return (
    <div ref={ref} data-testid="probe">
      {height ?? 'unmeasured'}
    </div>
  );
};

describe('useRemainingViewportHeight', () => {
  const originalInnerHeight = window.innerHeight;
  let rectSpy: jest.SpyInstance;

  beforeEach(() => {
    rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 200 } as DOMRect);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });

  it('measures the space from the element to the bottom of the window, less the gap', () => {
    const { getByTestId } = render(<HeightProbe bottomGapPx={24} />);

    expect(getByTestId('probe')).toHaveTextContent('776');
  });

  it('re-measures when the window is resized', () => {
    const { getByTestId } = render(<HeightProbe bottomGapPx={24} />);

    act(() => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(getByTestId('probe')).toHaveTextContent('576');
  });
});
