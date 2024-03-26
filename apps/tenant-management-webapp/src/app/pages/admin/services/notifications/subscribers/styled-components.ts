import styled from 'styled-components';

export const DataTableStyle = styled.div`
  & thead {
    width: '100%';
  }
  .action {
    width: 0;
    text-align-last: right;
  }

  .spread {
    width: 300px;
  }

  .no-wrap {
    white-space: nowrap;
  }
`;

export const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
  & > :not([data-account-link]):first-child {
    visibility: hidden;
  }
`;
