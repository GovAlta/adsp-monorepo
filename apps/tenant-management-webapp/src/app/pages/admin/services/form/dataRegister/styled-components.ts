import styled from 'styled-components';

export const DataRegisterIconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const DataRegisterEntryDetail = styled.div`
  background: var(--goa-color-greyscale-100);
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;
`;

export const DataRegisterUrn = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-xs);
  padding: var(--goa-space-s) var(--goa-space-m);
  background: var(--goa-color-greyscale-100);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
`;

export const DataRegisterEditorWrapper = styled.div`
  padding: var(--goa-space-m) 0;
`;

export const DataRegisterMonacoDiv = styled.div`
  display: flex;
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  padding: 0.15rem 0.15rem;
`;

export const DataRegisterTableWrapper = styled.div`
  overflow-y: visible;
`;

export const DataRegisterLoadingDiv = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--goa-space-xl);
`;
