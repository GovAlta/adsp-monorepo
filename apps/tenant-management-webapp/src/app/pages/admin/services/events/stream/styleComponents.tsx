import styled from 'styled-components';

export const NameDiv = styled.div`
  margin-top: 1.5rem;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
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

export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  text-align: left;
  padding: 1rem;
`;
