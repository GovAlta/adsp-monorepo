import styled from 'styled-components';

export const FormEditorTab = styled.div`
  font-weight: var(--goa-font-weight-bold);
`;

export const ReviewItem = styled.div`
  display: flex;
  width: 100%;
  border: 1px solid grey;
  border-radius: 5px;
  margin: 5px;
  padding: 10px;
`;

export const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;
export const EmptyBoxSpace = styled.div`
  height: 1.5rem;
  width: 1.5rem;
`;
export const Flex = styled.div`
  display: flex;
`;
export const ActionSpace = styled.div`
  height: 29px;
  width: 56px;
`;

export const QueueTaskDropdown = styled.div`
  width: 50%;
  margin-top: 0.25rem;
  margin-bottom: 3rem;
`;
export const Anchor = styled.div`
  color: #0070c4;
  text-decoration: underline;
  outline: none;
  cursor: pointer;
`;

export const LoadMoreWrapper = styled.div`
  padding-bottom: var(--goa-space-4xl);
`;

export const H3 = styled.h3`
  margin-top: 2rem !important;
`;

export const BorderBottom = styled.div`
  border-bottom: 1px solid #ccc;
`;

export const FormPreviewSpacer = styled.div`
  margin-top: var(--goa-space-l);
`;

export const H3Inline = styled.h3`
  display: inline-block;
  position: relative;
  top: var(--goa-space-s);
`;

export const ToolTipAdjust = styled.div`
  position: relative;
  top: var(--goa-space-s);
  display: inline-block;
`;

export const AddRemoveResourceTagSpacing = styled.div`
  margin-bottom: var(--goa-space-m);
`;

export const DataRegisterNameDiv = styled.div`
  margin-top: 1rem;
  font-size: var(--goa-font-size-7);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;

export const DataRegisterIconDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export const DataRegisterEntryDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-space-m);
  padding: var(--goa-space-m);
  text-align: left;
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
  max-height: 400px;
  overflow-y: auto;
`;

export const DataRegisterContainer = styled.div`
  min-height: 450px;
`;
