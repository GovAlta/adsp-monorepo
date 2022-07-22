import styled from 'styled-components';

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

export const AnonymousWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;
