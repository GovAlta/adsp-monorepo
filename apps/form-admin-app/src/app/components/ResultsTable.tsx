import { GoabTable, GoabTableProps } from '@abgov/react-components';
import { FunctionComponent, useCallback } from 'react';
import styled from 'styled-components';

// The table container of goa-table clips its content so that it can have rounded corners, and there
// is no part or custom property to change that from outside the component. Results tables include a
// column per data value of the definition, so they can be wider than the page, and the style is
// added to the shadow root so that the table scrolls to the columns past the right edge instead of
// hiding them.
const SCROLL_STYLE_ID = 'results-table-scroll';
const allowHorizontalScroll = (table: HTMLElement) => {
  const root = table?.shadowRoot;
  if (!root || root.getElementById(SCROLL_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = SCROLL_STYLE_ID;
  style.textContent = '.goatable { overflow-x: auto !important; }';
  root.appendChild(style);
};

// Table for results with a column per data value of the definition; it scrolls horizontally when
// the columns don't fit the page.
export const ResultsTable: FunctionComponent<GoabTableProps> = (props) => {
  const setScrollable = useCallback(
    (container: HTMLDivElement) => allowHorizontalScroll(container?.querySelector('goa-table')),
    [],
  );

  return (
    <div ref={setScrollable}>
      <GoabTable {...props} />
    </div>
  );
};

// Row of a results table that opens its item when selected. The whole row is the target, so it
// highlights under the pointer and takes focus so it can be selected from the keyboard.
export const SelectableRow = styled.tr`
  cursor: pointer;

  &:hover td {
    background: var(--goa-color-surface-item-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--goa-color-interactive-focus);
    outline-offset: -2px;
  }
`;
