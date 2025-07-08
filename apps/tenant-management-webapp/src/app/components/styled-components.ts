import styled from 'styled-components';

export const MarginAdjustment = styled.h4`
  margin-bottom: 0.5rem !important;
  margin-top: 2rem !important;
`;

export const PaddingRem = styled.div`
  padding-top: 1rem;
`;
export const Padding = styled.div`
  padding-top: var(--goa-space-m);
  padding-bottom: var(--goa-space-m);
`;

export const ActionButtonWrapper = styled.div`
  display: flex;
  gap: 1em;
  justify-content: flex-end;
`;
export const EmailLinkColor = styled.div`
  display: flex !important;
  align-items: inherit !important;
  color: #0070c4;
  a {
    padding-right: 4px;
    margin-bottom: 1px;
  }
`;
export const SpaceAdjust = styled.h3`
  padding-top: 3rem;
  padding-bottom: 1rem;
`;
export const LoadMoreWrapper = styled.div`
  padding-bottom: var(--goa-space-4xl);
`;

export const GapAdjustment = styled.h3`
  padding-top: 2rem;
  padding-button: 1rem;
`;
export const HyperLinkColor = styled.div`
  a {
    &:visited {
      color: var(--color-primary);
    }
  }
  padding-bottom: 1.75rem;
`;

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

export const ErrorMsg = styled.div`
  display: inline-flex;
  color: var(--color-red);
  pointer-events: none;
  gap: 0.25rem;
`;

export const HelpText = styled.div`
  font: var(--goa-typography-body-xs);
  color: var(--color-gray-900);

  display: flex;
  display-direction: row;
  justify-content: space-between;
  margin-top: 2px;
`;
