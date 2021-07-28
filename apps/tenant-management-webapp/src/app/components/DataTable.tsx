import React from 'react';
import styled from 'styled-components';

function DataTable({ children, ...props }): JSX.Element {
  return (
    <ScrollWrapper>
      <Table {...props}>{children}</Table>
    </ScrollWrapper>
  );
}

export default DataTable;

const ScrollWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;

  td {
    padding: 0.5rem;

    button {
      /* TODO: GoA button with a top margin, which is unexpected. After the fix, we can remove this line */
      margin-top: 0px !important;
    }
  }

  tr {
    border-bottom: 1px solid var(--color-table-border);
  }

  tr.selected {
    background-color: var(--color-table-tr-selected);
  }

  th {
    padding: 0.5rem;
    font-weight: var(--fw-bold);
    color: var(--color-font-header);
  }

  thead th {
    font-size: var(--fs-base);
    border-bottom: 2px solid var(--color-table-border);
    text-align: left;
    white-space: nowrap;
  }
`;
