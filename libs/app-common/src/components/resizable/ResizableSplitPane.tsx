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
      <SplitPanePanel $width={showSplit ? leftWidth : undefined}>{left}</SplitPanePanel>
      {showSplit && (
        <>
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
          />
          <SplitPanePanel $fill>{right}</SplitPanePanel>
        </>
      )}
    </SplitPaneContainer>
  );
};
