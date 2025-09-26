import styled from 'styled-components';

export const CenterPosition = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  height: 264px;
  &:before {
    content: '';
    background-color: red;
  }
`;

export const HelpText = styled.div`
  font: var(--goa-typography-body-xs);
  color: var(--color-gray-900);

  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
`;

export const ErrorMsg = styled.div`
  display: inline-flex;
  color: var(--color-red);
  pointer-events: none;
  gap: 0.25rem;
`;

export const MarginAdjustment = styled.h4`
  margin-bottom: 0.5rem !important;
  margin-top: 2rem !important;
`;

export const PaddingRem = styled.div`
  padding-top: 1rem;
`;
