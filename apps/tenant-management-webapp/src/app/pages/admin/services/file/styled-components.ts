import styled from 'styled-components';

export const DeleteInDaysLabel = styled.label`
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  font-size: 18px;
  padding-bottom: 0.5rem;
  background: #f1f1f1;
  border-width: 1px 0px 1px 1px;
  border-style: solid;
  border-color: #666666;
  border-radius: 4px 0px 0px 4px;
`;

export const RetentionPolicyLabel = styled.label`
  font-size: 24px !important;
  line-height: 32px;
  margin-top: 24px;
  font-weight: normal !important;
`;

export const DeleteInDaysInputWrapper = styled.div`
  display: inline-block;
  width: 10rem;
  .goa-input {
    border-radius: 0px 4px 4px 0px !important;
  }
  z-index: 0;
  position: revert;
  margin-bottom: 2rem;
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
