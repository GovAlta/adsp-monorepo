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

export const ButtonPadding = styled.div`
  padding-bottom: var(--goa-space-l);
  padding-top: var(--goa-space-l);
`;

export const MoreDetails = styled.div`
  background-color: var(--goa-color-greyscale-100);
  padding: var(--goa-space-s) var(--goa-space-l) var(--goa-space-l) var(--goa-space-l);
  width: 100%;
  text-align: left;
  p {
    font-weight: bold;
    padding-top: var(--goa-space-s);
    margin-bottom: var(--goa-space-xs);
  }
  span {
    white-space: normal;
  }
`;

export const ConnectionPadding = styled.div`
  padding: 0 0 var(--goa-space-l) 0;
`;

export const MarginTop = styled.div`
  margin-top: var(--goa-space-m);
`;
