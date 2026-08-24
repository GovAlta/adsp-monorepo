import styled, { css } from 'styled-components';

export const DIVIDER_WIDTH = 9;

export const SplitPaneContainer = styled.div<{ $dragging: boolean }>`
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  user-select: ${({ $dragging }) => ($dragging ? 'none' : 'auto')};
`;

// The pane width is applied inline rather than interpolated here so that a drag does not inject a
// new generated class for every pixel of movement.
export const SplitPanePanel = styled.div<{ $fill?: boolean; $collapsed?: boolean }>`
  display: flex;
  flex: ${({ $fill }) => ($fill ? '1 1 0' : '1 1 100%')};
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: none;
    `}
`;

export const SplitPaneDivider = styled.div<{ $dragging: boolean }>`
  position: relative;
  flex: 0 0 ${DIVIDER_WIDTH}px;
  width: ${DIVIDER_WIDTH}px;
  height: 100%;
  cursor: col-resize;
  touch-action: none;
  outline: none;

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 4px;
    width: ${({ $dragging }) => ($dragging ? '2px' : '1px')};
    background: ${({ $dragging }) =>
      $dragging ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-200)'};
    content: '';
  }

  &:hover::before {
    width: 2px;
    background: var(--goa-color-interactive-default);
  }

  &:focus-visible::before {
    width: 3px;
    background: var(--goa-color-interactive-default);
    box-shadow: 0 0 0 2px var(--goa-color-greyscale-white);
  }
`;
