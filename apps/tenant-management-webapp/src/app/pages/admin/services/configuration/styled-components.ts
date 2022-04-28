import styled from 'styled-components';

// configuration
export const NameDiv = styled.div`
  margin-top: 1rem;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;

// definitionsList
export const EntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
  text-align: left;
`;

export const TableDiv = styled.div`
  #configuration-name {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  #configuration-action {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }
`;

export const IconDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const NoItem = styled.div`
  text-align: center;
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
`;
