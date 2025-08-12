import styled from 'styled-components';

export const ChipsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  padding-bottom: 1em;
  padding-top: 0.5em;
`;

export const TableWrapper = styled.div`
  tr td:nth-child(1) {
    width: 40%;
  }

  tr td:nth-child(2) {
    width: 40%;
  }

  tr td:nth-child(3) {
    width: 20%;
  }

  tr th:nth-child(1) {
    width: 40%;
  }

  tr th:nth-child(2) {
    width: 40%;
  }

  tr th:nth-child(3) {
    width: 20%;
  }
`;

export const IconDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;
export const TableDiv = styled.div`
  #stream-service-actions {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }
`;
export const StreamModalStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }

  .messages {
    margin-top: 0;
  }

  h3 {
    margin-bottom: 0;
  }
`;

export const NoPaddingTd = styled.td`
  padding: 0px !important;
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const Details = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
  margin-bottom: 1rem;
`;

export const DataTableWrapper = styled.div`
  .goa-checkbox input[type='checkbox'] {
    display: none !important;
  }

  .goa-checkbox {
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
    width: 27em;
  }

  .role {
    width: 6em;
    text-align: center;
  }
  .role-label {
    width: 29em;
  }
  .role-checkbox {
    width: 4em;
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
