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
    overflow-wrap: anywhere;
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
