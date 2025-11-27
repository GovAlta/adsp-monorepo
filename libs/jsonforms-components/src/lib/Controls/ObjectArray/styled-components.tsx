import styled from 'styled-components';

export const DeleteDialogContent = styled.div`
  margin-bottom: var(--goa-space-m);
`;

export const NonEmptyCellStyle = styled.div`
  goa-table thead th {
    background-color: #000:
  }
`;

export const ToolBarHeader = styled.div`
  margin-bottom: var(--goa-space-l);
`;

export const ObjectArrayTitle = styled.h3`
  margin-bottom: var(--goa-space-l);

  span {
    color: #666666;
    font-size: var(--goa-font-size-2);
  }
`;

export const RequiredSpan = styled.span`
  color: #666666;
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-2);
`;

export const TextCenter = styled.div`
  text-align: center;
`;

export const SideMenuItem = styled.div`
  &:hover {
    background: #f1f1f1;
  }
`;

export const RowFlex = styled.div`
  display: flex;
  align-items: stretch;
`;

export const RowFlexMenu = styled.div`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #dcdcdc;
`;

export const FlexTabs = styled.div`
  flex-direction: column;
  flex: 1;
  overflow-y: auto !important;
  margin-right: 1.5rem;
`;

export const FlexForm = styled.div`
  flex-direction: column;
  margin: 1.5rem 0;
  flex: 3;
`;

export const TabName = styled.div`
  margin: 1rem 0 1rem 1rem;
  font-weight: 700;
`;

export const Trash = styled.div`
  margin: 0.75rem 1.25rem 0.75rem 0.75rem;
  margin-left: auto;
`;

export const ListContainer = styled.div`
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
  background-color: var(--goa-color-warning-default);
`;

export const FixTableHeaderAlignment = styled.div`
  table thead th:nth-child(3) {
    text-align: center;
  }

  table tbody td:nth-child(3) {
    text-align: center;
  }
`;
