import React, { FunctionComponent, KeyboardEvent, PointerEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { DIVIDER_WIDTH, SplitPaneContainer, SplitPaneDivider, SplitPanePanel } from './styled-components';

const KEYBOARD_STEP = 16;
const LARGE_KEYBOARD_STEP = 64;

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  initialLeftPercent?: number;
  minPaneWidth?: number;
  rightHidden?: boolean;
  resetKey?: unknown;
  testId?: string;
  ariaLabel?: string;
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

export const ResizableSplitPane: FunctionComponent<ResizableSplitPaneProps> = ({
  left,
  right,
  initialLeftPercent = 50,
  minPaneWidth = 300,
  rightHidden = false,
  resetKey,
  testId = 'resizable-split-pane',
  ariaLabel = 'Resize editor and preview panes',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const maximumLeftWidth = containerWidth - minPaneWidth - DIVIDER_WIDTH;
  const canSplit = !rightHidden && containerWidth >= minPaneWidth * 2 + DIVIDER_WIDTH;

  const updateLeftWidth = (width: number) => {
    if (canSplit) {
      setLeftWidth(clamp(width, minPaneWidth, maximumLeftWidth));
    }
  };

  const resetLeftWidth = () => {
    if (containerWidth > 0) {
      updateLeftWidth((containerWidth * initialLeftPercent) / 100);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerWidth = (width: number) => {
      setContainerWidth(width);
      if (width >= minPaneWidth * 2 + DIVIDER_WIDTH) {
        const maximum = width - minPaneWidth - DIVIDER_WIDTH;
        setLeftWidth((current) =>
          current === null
            ? clamp((width * initialLeftPercent) / 100, minPaneWidth, maximum)
            : clamp(current, minPaneWidth, maximum),
        );
      }
    };

    updateContainerWidth(container.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver((entries) => updateContainerWidth(entries[0].contentRect.width));
    observer.observe(container);

    return () => observer.disconnect();
  }, [initialLeftPercent, minPaneWidth]);

  useEffect(() => {
    resetLeftWidth();
    // Reset is intentionally controlled by the host rather than persisted between modal sessions.
  }, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    updateLeftWidth(event.clientX - containerRef.current.getBoundingClientRect().left);
  };

  // Also runs on lost pointer capture (window blur, tab switch, a native plugin taking the pointer);
  // without it dragging stays latched on and the divider keeps tracking the pointer without a button held.
  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (leftWidth === null) return;

    const step = event.shiftKey ? LARGE_KEYBOARD_STEP : KEYBOARD_STEP;
    let nextWidth: number | null = null;

    if (event.key === 'ArrowLeft') nextWidth = leftWidth - step;
    if (event.key === 'ArrowRight') nextWidth = leftWidth + step;
    if (event.key === 'Home') nextWidth = minPaneWidth;
    if (event.key === 'End') nextWidth = maximumLeftWidth;

    if (nextWidth !== null) {
      event.preventDefault();
      updateLeftWidth(nextWidth);
    }
  };

  const showSplit = canSplit && leftWidth !== null;

  return (
    <SplitPaneContainer ref={containerRef} $dragging={dragging} data-testid={testId}>
      <SplitPanePanel style={showSplit ? { flex: `0 0 ${leftWidth}px`, width: `${leftWidth}px` } : undefined}>
        {left}
      </SplitPanePanel>
      {showSplit && (
        <SplitPaneDivider
          role="separator"
          aria-label={ariaLabel}
          aria-orientation="vertical"
          aria-valuemin={minPaneWidth}
          aria-valuemax={Math.round(maximumLeftWidth)}
          aria-valuenow={Math.round(leftWidth)}
          tabIndex={0}
          $dragging={dragging}
          onDoubleClick={resetLeftWidth}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            setDragging(true);
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={stopDragging}
        />
      )}
      {/* Collapsed with CSS rather than unmounted: the right pane is measurement driven, and tearing it
          down whenever the container is unmeasured or too narrow destroys host state that only a page
          reload restores. rightHidden stays an unmount because that is the host asking for it. */}
      {!rightHidden && (
        <SplitPanePanel $fill $collapsed={!showSplit} aria-hidden={!showSplit} data-testid={`${testId}-right`}>
          {right}
        </SplitPanePanel>
      )}
    </SplitPaneContainer>
  );
};
