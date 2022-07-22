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
  & td:first-child {
    width: 120px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
  }
  & td:nth-child(2) {
    word-wrap: break-word;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
    text-align: right;
  }
`;

export const IconDiv = styled.div`
  width: 100%;
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
  display: flex;
  padding-top: 1rem;
`;

export const StatusIcon = styled.div`
  margin-right: 0.25rem;
  padding-top: 0.25rem;
`;
export const DescriptionDiv = styled.div`
  margin-left: 2rem;
  font-size: 12px;
`;
export const ErrorStatusText = styled.div`
  font-size: var(--fs-sm);
  line-height: calc(var(--fs-sm) + 0.5rem);
  color: var(--color-red);
  margin-top: 1rem;
`;
