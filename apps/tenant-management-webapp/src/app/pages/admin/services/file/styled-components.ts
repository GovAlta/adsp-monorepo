import styled from 'styled-components';

export const RetentionPolicyLabel = styled.label`
  font-size: 24px !important;
  line-height: 32px;
  margin-top: 24px;
  font-weight: normal !important;
`;

export const FileIdItem = styled.div`
  background: #f1f1f1;
  .goa-input {
    background: #f1f1f1 !important;
  }
  .input--goa {
    background: #f1f1f1 !important;
  }
`;
export const ModalOverwrite = styled.div`
  .modal {
    max-height: 95% !important;
    min-width: 37.5em;
    max-width: 2000px;
  }

  .title {
    font-weight: 700;
    font-size: var(--fs-lg);
    margin-top: 15px;
  }
`;

export const AnonymousReadWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;

export const RetentionPolicyWrapper = styled.div`
  margin-top: 12px;
  margin-bottom: 12px;
`;

export const TextLoadingIndicator = styled.div`
  animation: blinker 1s linear infinite;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
`;

export const InfoCircleWrapper = styled.div`
  position: relative;
  top: 3px;
  transform: scale(1.2);
  margin-left: 0.5rem;
  display: inline-block;
`;

export const RetentionToolTip = styled.p`
  font-size: 16px !important;
  font-weight: normal;
  line-height: 1.5rem;
  z-index: 1000;
`;

export const FileTypeEditor = styled.div`
  width: 100%;

  .hr-resize {
    margin-top: var(--goa-spacing-s);
  }

  .hr-resize-bottom {
    margin-bottom: var(--goa-spacing-2xs);
    margin-top: var(--goa-spacing-xl);
  }
`;

export const FileTypeEditorTitle = styled.div`
  font-size: var(--fs-xl);
  line-height: var(--lh-lg);
  font-weight: var(--fw-regular);
`;

export const SpinnerPadding = styled.div`
  margin: 200px 0 0 0;
`;

export const SpinnerModalPadding = styled.div`
  margin: 0 0 0 0;
  height: 467px;
`;

export const SpinnerPaddingSmall = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
export const OverflowWrap = styled.div`
  overflow-wrap: break-word;
  overflow-y: hidden;
`;
