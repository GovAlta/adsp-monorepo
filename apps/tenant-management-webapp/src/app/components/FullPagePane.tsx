import React, { FunctionComponent, KeyboardEvent, ReactNode, useState } from 'react';
import styled, { css } from 'styled-components';
import { GoabIconButton } from '@abgov/react-components';

// Above the editor modal (z-index 10000) so the pane covers the preview and the editor chrome.
const FULL_PAGE_Z_INDEX = 10001;

const Pane = styled.div<{ $fullPage: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;

  ${({ $fullPage }) =>
    $fullPage &&
    css`
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: ${FULL_PAGE_Z_INDEX};
      height: 100%;
      box-sizing: border-box;
      padding: var(--goa-space-s);
      background: var(--goa-color-greyscale-white);
    `}
`;

const PaneActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
`;

// Matches the label a GoabFormItem renders, so a heading passed here reads as the field's own label.
const PaneHeading = styled.span`
  font: var(--goa-form-item-label-typography);
`;

const PaneContent = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;

  > * {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    height: 100%;
  }
`;

interface FullPagePaneProps {
  /** Names the editor the toggle acts on (e.g. 'Body') so each tab's control reads distinctly. */
  label: string;
  /** Rendered on the toggle's row, for hosts that would otherwise label the editor on its own line. */
  heading?: ReactNode;
  testId: string;
  /** Height of the pane at regular size; in full page mode the pane fills the viewport instead. */
  height?: string | number;
  children: ReactNode;
}

/**
 * Wraps an editor so the user can lift it out of the page into a full page view and put it back.
 * The pane stays mounted either way, so the editor keeps its content, cursor and undo history.
 */
export const FullPagePane: FunctionComponent<FullPagePaneProps> = ({ label, heading, testId, height, children }) => {
  const [fullPage, setFullPage] = useState(false);
  const toggleLabel = fullPage ? `Return ${label} editor to regular size` : `Edit ${label} in full page`;

  // Escape is the conventional way out of a full page view. Monaco stops propagation for the escapes
  // it handles itself (closing the suggestion widget, leaving find), so only the rest reach us here.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (fullPage && event.key === 'Escape') {
      setFullPage(false);
    }
  };

  return (
    <Pane
      $fullPage={fullPage}
      style={fullPage ? undefined : { height }}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      data-full-page={fullPage}
    >
      <PaneActions>
        <PaneHeading>{heading}</PaneHeading>
        <GoabIconButton
          icon={fullPage ? 'contract' : 'expand'}
          size="small"
          title={toggleLabel}
          ariaLabel={toggleLabel}
          testId={`${testId}-toggle`}
          onClick={() => setFullPage((current) => !current)}
        />
      </PaneActions>
      <PaneContent>{children}</PaneContent>
    </Pane>
  );
};
