import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullScreenEditor } from './FullScreenEditor';

jest.mock('app/notificationBanner', () => ({ NotificationBanner: () => null }));
jest.mock('./TabletMessage', () => ({ TabletMessage: () => null }));

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe = () => {
    this.callback([{ contentRect: { width: 1000 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  };

  disconnect = jest.fn();
  unobserve = jest.fn();
}

describe('FullScreenEditor', () => {
  beforeAll(() => {
    global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    global.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
  });

  beforeEach(() => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 0,
      height: 0,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('allows the user to resize the editor and preview panes', () => {
    // Arrange
    const { getByRole } = render(
      <FullScreenEditor editor={<div>Editor</div>} preview={<div>Preview</div>} onGoBack={jest.fn()} resizable />,
    );
    const separator = getByRole('separator');

    // Act
    fireEvent.pointerDown(separator, { pointerId: 1 });
    fireEvent.pointerMove(separator, { clientX: 650, pointerId: 1 });
    fireEvent.pointerUp(separator, { pointerId: 1 });

    // Assert
    expect(separator).toHaveAttribute('aria-valuenow', '650');
  });

  it('preserves the fixed layout when resizing is not enabled', () => {
    // Arrange
    const { queryByRole } = render(
      <FullScreenEditor editor={<div>Editor</div>} preview={<div>Preview</div>} onGoBack={jest.fn()} />,
    );

    // Act
    const separator = queryByRole('separator');

    // Assert
    expect(separator).not.toBeInTheDocument();
  });

  it('hides the preview pane when requested', () => {
    // Arrange
    const { queryByText } = render(
      <FullScreenEditor
        editor={<div>Editor</div>}
        preview={<div>Preview</div>}
        previewHidden
        onGoBack={jest.fn()}
        resizable
      />,
    );

    // Act
    const preview = queryByText('Preview');

    // Assert
    expect(preview).not.toBeInTheDocument();
  });
});
