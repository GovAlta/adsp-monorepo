import styled from 'styled-components';

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const TableDiv = styled.div`
  word-wrap: break-word;
  table-layout: fixed;
  & th:nth-child(3) {
    min-width: 160px;
  }

  & td:nth-child(3) {
    min-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & .meta {
    padding: 0;
  }
`;

export const HeadingDiv = styled.div`
  display: flex;
  column-gap: 0.6rem;

  img {
    margin-bottom: 4px;
  }
`;

export const OverFlowWrapTableCell = styled.td`
  overflow-wrap: anywhere;
`;
export const CheckBoxWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;
