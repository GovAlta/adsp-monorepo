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
    overflow-x: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
  }

  #configuration-action {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: left;
    padding: 0.5rem;
  }
  & td:first-child {
    max-width: 100px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }
  & td:last-child {
    width: 40px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    justify-content: center;
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

export const StatusText = styled.div`
  display: 'flex';
  padding-top: '1rem';
`;
