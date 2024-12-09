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

export const ObjectArrayTitle = styled.h2`
  margin-bottom: var(--goa-space-l);
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
  background-color: #f1f1f1 !important;
`;
