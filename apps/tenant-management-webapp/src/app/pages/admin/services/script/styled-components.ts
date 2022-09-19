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
`;
export const UseServiceAccountWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;

export const DataTableWrapper = styled.div`
  .goa-checkbox input[type='checkbox'] {
    display: none !important;
  }

  .goa-checkbox {
    margin-left: 10px;
    min-height: calc(3rem - 10px);
  }

  th {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: white;
    padding-left: 0em !important;
  }
  thead,
  tbody {
    display: block;
  }

  tbody {
    overflow-y: auto;
    overflow-x: hidden;
  }

  .role-name {
    width: 33em;
  }

  .role {
    width: 10em;
  }

  td {
    padding: 0em !important;
  }

  table {
    border-collapse: collapse !important;
    width: 100%;
  }

  th {
    white-space: pre-wrap;
  }

  thead {
    padding-top: 1.25rem;
  }
`;
