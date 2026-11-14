import styled from 'styled-components';

export const DeleteDialogContent = styled.div`
  margin-bottom: var(--goa-space-m);
`;

export const MarginTop = styled.div`
  margin-top: var(--goa-space-l);
`;

export const NonEmptyCellStyle = styled.div``;

export const ToolBarHeader = styled.div`
  margin-bottom: var(--goa-space-s);
`;

export const ReviewItemFrame = styled.div`
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
  padding: var(--goa-space-m) var(--goa-space-l);
  margin-bottom: var(--goa-space-l);
  background-color: var(--goa-color-greyscale-white);
`;

export const ReviewRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  align-items: flex-start;

  @media (max-width: 479px) {
    flex-direction: column;
  }
`;

export const ReviewRowLabel = styled.strong`
  width: 50%;
  flex-shrink: 0;

  @media (max-width: 479px) {
    width: auto;
  }
`;

export const ReviewRowValue = styled.span`
  margin-left: 1rem;
  min-width: 0;
  overflow-wrap: anywhere;

  @media (max-width: 479px) {
    margin-left: 0;
  }
`;

export const ObjectArrayTitle = styled.h3`
  margin-bottom: var(--goa-space-s);

  span {
    color: #666666;
    font-size: var(--goa-font-size-2);
  }
`;

export const RequiredSpan = styled.span`
  color: #666666;
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-2);
  margin-left: var(--goa-space-xs);
`;

export const TextCenter = styled.div`
  text-align: center;
`;

export const SideMenuItem = styled.div`
  margin-top: 1rem;
`;

export const RowFlex = styled.div`
  display: flex;
  margin: 1.5rem 0 1.5rem 0;

  align-items: flex-start;

  /* The list and detail panes need more room than a phone has, so they stack. */
  @media (max-width: 639px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const RowFlexMenuMain = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border: 1px solid var(--goa-color-greyscale-300);
  border-radius: var(--goa-border-radius-m);
  margin-top: var(--goa-space-xs);
  background-color: var(--goa-color-greyscale-white);
  padding: 0;
  gap: 0;
  position: relative;
  overflow: visible;

  &:hover {
    border-color: var(--goa-color-greyscale-400);
  }
`;

export const RowFlexMenuLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border: 1px solid var(--goa-color-greyscale-300);
  border-radius: var(--goa-border-radius-m);
  margin-top: var(--goa-space-xs);
  padding: 0;
  gap: 0;
  position: relative;
  overflow: visible;

  &:hover {
    border-color: var(--goa-color-greyscale-400);
  }
`;

export const FlexTabs = styled.div`
  flex-direction: column;
  flex: 1;
  overflow-y: auto !important;

  @media (max-width: 639px) {
    flex: none;
  }
`;
export const FlexTabsWithMargin = styled.div`
  flex-direction: column;
  flex: 1;
  overflow-y: auto !important;
  margin-right: 1.5rem;
  min-width: 10rem;

  flex-shrink: 1;
  // max-height: 500px;

  /* height overrides the desktop height ListWithDetailControl sets to match the detail pane. */
  @media (max-width: 639px) {
    flex: none;
    height: auto !important;
    min-width: 0;
    margin-right: 0;
    margin-bottom: var(--goa-space-m);
  }
`;

export const FlexForm = styled.div`
  flex-direction: column;
  flex: 3;
  /* Shrink rather than squeeze the item tabs to nothing at tablet widths. */
  min-width: 0;
  overflow-y: visible;

  @media (max-width: 639px) {
    flex: none;
    min-width: 0;
  }
`;

export const TabName = styled.div`
  margin: 1rem 0 1rem 1rem;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Trash = styled.div`
  margin: 0.9rem 0.4rem 0.6rem 0.75rem;
  margin-left: auto;
`;

export const ListContainer = styled.div`
  padding: 0 0 0 0;
`;
export const DetailMargin = styled.div`
  padding: 0 0 var(--goa-space-l) 0;
`;

export const UpdateListContainer = styled.div`
  width: 100%;
  border: 1px solid #dcdcdc;
  padding: var(--goa-space-xl);

  @media (max-width: 639px) {
    box-sizing: border-box;
    padding: var(--goa-space-m);
  }
`;

export const CompleteContainer = styled.div`
  padding: 0 1.5rem 0 0;
  border: 1px solid #dcdcdc;
`;

export const TableTHHeader = styled.th`
  background-color: var(--goa-color-greyscale-100) !important;
  vertical-align: top;
`;

export const ObjectArrayWarningIconDiv = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-interactive-error);
`;

export const ListWithDetailWarningIconDiv = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: var(--goa-font-size-3);
  color: var(--goa-color-interactive-error);
`;
export const ObjectArrayRequiredTextLabel = styled.label`
  color: var(--goa-color-interactive-error);
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-3);
  line-height: var(--goa-line-height-1);
  font-style: normal;
`;

export const HasErrorLabel = styled.div`
  margin-top: var(--goa-space-m);
  color: var(--goa-color-interactive-error);
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-2);
  line-height: var(--goa-line-height-1);
  font-style: normal;
`;

export const HilightCellWarning = styled.div`
  background-color: transparent;
`;

export const FixTableHeaderAlignment = styled.div`
  table thead th:nth-child(3) {
    text-align: center;
  }

  table tbody td:nth-child(3) {
    text-align: center;
  }

  /* A row of inputs doesn't fit a phone, so each row stacks its cells and labels them from data-label. */
  @media (max-width: 639px) {
    table thead {
      display: none;
    }

    table tbody tr {
      display: block;
      padding: var(--goa-space-s) 0;
      border-bottom: 1px solid var(--goa-color-greyscale-200);
    }

    table tbody td,
    table tbody td:nth-child(3) {
      display: block;
      padding: var(--goa-space-2xs) 0;
      border-bottom: none;
      text-align: left;
    }

    table tbody td[data-label]::before {
      content: attr(data-label);
      display: block;
      margin-bottom: var(--goa-space-2xs);
      color: var(--goa-color-text-secondary);
      font: var(--goa-typography-body-s);
    }

    table tbody td:not([data-label]) {
      padding-top: 0 !important;
      text-align: right;
    }
  }
`;

export const ListWithDetailsReviewCellDiv = styled.div`
  display: flex;
  flex-direction: column;
  text-align: start;
`;

export const IconsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--goa-space-xs);
  padding-bottom: var(--goa-space-xs);
`;

/*
 * A row of inputs can't wrap, so a wide table scrolls here rather than widening the form.
 * contain keeps the table's width out of the ancestors' sizing: a group's goa-container
 * otherwise grows to fit the table and pushes it off a narrow screen.
 */
export const TableScrollContainer = styled.div`
  overflow-x: auto;
  contain: inline-size;
`;

export const TableContentContainer = styled.div`
  padding: var(--goa-space-l);
`;
export const NoDataMessage = styled.div`
  padding: var(--goa-space-xl) var(--goa-space-l);
  color: var(--goa-color-greyscale-700);
  font: var(--goa-typography-body-m);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
`;
