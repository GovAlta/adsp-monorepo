import React from 'react';
import styled from 'styled-components';

function DataTable({ children, ...props }) {
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
    padding-left: 8px;
    padding-top: 6px;
    padding-bottom: 10px;
    padding-right: 8px;

    button {
      /* TODO: GoA button with a top margin, which is unexpected. After the fix, we can remove this line */
      margin-top: 0px !important;
    }
  }

  tr {
    border-bottom: 1px solid #707070;
  }

  tr.selected {
    background-color: #f1f1f1;
  }

  th {
    padding: 0.5rem;
    color: #666666;
  }

  thead th {
    font-size: var(--fs-base);
    border-bottom: 1px solid #707070;
    text-align: left;
    white-space: nowrap;
  }
`;
