import styled from 'styled-components';

export const FormFieldWrapper = styled.div`
  margin-bottom: var(--goa-space-l);
`;

export const WarningIconDiv = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--goa-space-2xs);
  font: var(--goa-form-item-message-typography);
  color: var(--goa-form-item-error-message-color);
  margin-top: var(--goa-form-item-message-margin-top);
`;

export const RequiredTextLabel = styled.label`
  color: var(--goa-color-greyscale-700);
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-2);
  line-height: var(--goa-line-height-1);
  font-style: normal;
`;

export const PageReviewNameCol = styled.td`
  width: 40%;
  padding-top: var(--goa-space-s);
  padding-bottom: var(--goa-space-s);
  padding-right: var(--goa-space-m);
  vertical-align: top;
`;

export const PageReviewValueCol = styled.td`
  width: 40%;
  text-align: left;
  vertical-align: top;
`;

export const PageReviewContainer = styled.td`
  padding: 12px 0px;
  border-bottom: 1px solid #ccc;
  width: 100%;
  vertical-align: top;
`;

export const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

export const ReviewLabel = styled.div`
  font-weight: var(--goa-font-weight-bold);
  font-size: var(--goa-font-size-4);
  line-height: var(--goa-line-height-3);
  color: var(--goa-color-text-default);
`;

export const ReviewValue = styled.div`
  margin-top: var(--goa-space-m);
  color: var(--goa-color-text-default);
  font-size: var(--goa-font-size-4);
  line-height: var(--goa-line-height-3);
`;

//Check and unchecked are different heights otherwise
export const CheckboxWrapper = styled.div`
  min-height: 28px;
`;
export const H4Large = styled.h4`
  margin: 0 0 0.25rem 0;
  fontsize: larger;
`;
export const Row = styled.h4`
  border-bottom: 1px solid #ddd;
`;
