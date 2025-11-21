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
