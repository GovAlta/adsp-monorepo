import styled from 'styled-components';

export const FormFieldWrapper = styled.div`
  margin-bottom: var(--goa-space-l);
`;

export const WarningIconDiv = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 0.25rem;
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-interactive-error);
`;

export const RequiredTextLabel = styled.label`
  color: var(--goa-color-greyscale-700);
  font-weight: var(--goa-font-weight-regular);
  font-size: var(--goa-font-size-2);
  line-height: var(--goa-line-height-1);
  font-style: normal;
`;

export const PageReviewNameCol = styled.td`
  width: 70%;
  padding-top: var(--goa-space-s);
  padding-bottom: var(--goa-space-s);
  padding-right: var(--goa-space-m);
`;

export const PageReviewValueCol = styled.td`
  width: 20%;
  text-align: left;
`;

export const PageReviewActionCol = styled.td`
  width: 10%;
`;
//Check and unchecked are different heights otherwise
export const CheckboxWrapper = styled.div`
  height: 28px;
`