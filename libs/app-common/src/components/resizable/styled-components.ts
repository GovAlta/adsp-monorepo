import styled from 'styled-components';

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

export const SplitPanePanel = styled.div<{ $fill?: boolean; $width?: number }>`
  display: flex;
  flex: ${({ $fill, $width }) => ($fill ? '1 1 0' : $width === undefined ? '1 1 100%' : `0 0 ${$width}px`)};
  width: ${({ $width }) => ($width === undefined ? '100%' : `${$width}px`)};
  /* Stretch rather than height: 100%, which collapses to auto when the host gives the container an
     indefinite height. */
  align-self: stretch;
  min-width: 0;
  overflow: hidden;
`;

export const SplitPaneDivider = styled.div<{ $dragging: boolean }>`
  position: relative;
  flex: 0 0 ${DIVIDER_WIDTH}px;
  width: ${DIVIDER_WIDTH}px;
  /* The divider has no content, so height: 100% against an indefinite container collapsed it to zero
     and left nothing to see or grab. */
  align-self: stretch;
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
