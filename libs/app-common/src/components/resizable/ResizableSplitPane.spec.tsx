import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResizableSplitPane } from './ResizableSplitPane';

let observedWidth = 1000;

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe = () => {
    this.callback(
      [{ contentRect: { width: observedWidth } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  };

  disconnect = jest.fn();
  unobserve = jest.fn();
}

describe('ResizableSplitPane', () => {
  beforeAll(() => {
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    observedWidth = 1000;
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 0,
      height: 0,
      left: 0,
      right: observedWidth,
      top: 0,
      width: observedWidth,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('renders both panes with an accessible separator', () => {
    const { getByRole, getByText } = render(
      <ResizableSplitPane left={<div>Editor</div>} right={<div>Preview</div>} initialLeftPercent={48} />,
    );

    expect(getByText('Editor')).toBeInTheDocument();
    expect(getByText('Preview')).toBeInTheDocument();
    expect(getByRole('separator')).toHaveAttribute('aria-valuenow', '480');
    expect(getByRole('separator')).toHaveAttribute('aria-valuemin', '300');
    expect(getByRole('separator')).toHaveAttribute('aria-valuemax', '691');
  });

  it('supports keyboard resizing and clamps both pane minimums', () => {
    const { getByRole } = render(<ResizableSplitPane left={<div />} right={<div />} />);
    const separator = getByRole('separator');

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    expect(separator).toHaveAttribute('aria-valuenow', '516');

    fireEvent.keyDown(separator, { key: 'Home' });
    expect(separator).toHaveAttribute('aria-valuenow', '300');

    fireEvent.keyDown(separator, { key: 'End' });
    expect(separator).toHaveAttribute('aria-valuenow', '691');
  });

  it('renders only the editor when the right pane is hidden', () => {
    const { getByText, queryByRole, queryByText } = render(
      <ResizableSplitPane left={<div>Editor</div>} right={<div>Preview</div>} rightHidden />,
    );

    expect(getByText('Editor')).toBeInTheDocument();
    expect(queryByText('Preview')).not.toBeInTheDocument();
    expect(queryByRole('separator')).not.toBeInTheDocument();
  });

  it('falls back to the editor when the container cannot fit both minimum widths', () => {
    observedWidth = 600;
    const { getByText, queryByRole, queryByText } = render(
      <ResizableSplitPane left={<div>Editor</div>} right={<div>Preview</div>} />,
    );

    expect(getByText('Editor')).toBeInTheDocument();
    expect(queryByText('Preview')).not.toBeInTheDocument();
    expect(queryByRole('separator')).not.toBeInTheDocument();
  });
});
