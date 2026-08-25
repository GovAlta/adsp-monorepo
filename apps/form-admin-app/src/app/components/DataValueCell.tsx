import styled from 'styled-components';

// Data values are content of the form and can be long, so the cell is kept within a width that
// leaves room for the other columns and wraps values that don't include spaces to break on.
export const DataValueCell = styled.td`
  background: var(--goa-color-greyscale-100);
  min-width: 10rem;
  max-width: 20rem;
  overflow-wrap: anywhere;
`;
