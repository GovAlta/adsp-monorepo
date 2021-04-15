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
  width: 100%;
  td,
  th {
    padding: 0.5rem;
  }
  thead th {
    font-size: var(--fs-lg);
    border-bottom: 2px solid #ccc;
    text-align: left;
    white-space: nowrap;
  }
  tbody tr:nth-child(even) {
    background-color: #fafafa;
  }
`;
