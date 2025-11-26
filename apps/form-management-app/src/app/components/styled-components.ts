import styled from 'styled-components';

export const BackButtonWrapper = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--goa-color-interactive);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--goa-color-interactive-hover);
    color: var(--goa-color-text-light);
  }

  &:focus {
    outline: 2px solid var(--goa-color-interactive-focus);
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }
`;

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

export const CenterActionWrapper = styled.div`
  display: flex;
  gap: 1em;
  justify-content: center;
`;

export const SpaceAdjust = styled.h3`
  padding-top: 3rem;
  padding-bottom: 1rem;
`;

export const LoadMoreWrapper = styled.div`
  padding-bottom: var(--goa-space-4xl);
  text-align: center;
`;

export const GapAdjustment = styled.h3`
  padding-top: 2rem;
  padding-bottom: 1rem;
`;

export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const ContentWrapper = styled.div`
  padding: 1rem;
`;

export const SkeletonWrapper = styled.div`
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
`;

export const LoadingSkeletonWrapper = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
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
  justify-content: space-between;
  margin-top: 2px;
`;

export const FormSection = styled.div`
  margin-bottom: 2rem;
`;

export const FormHeaderWrapper = styled.div`
  margin-bottom: 1rem;
`;

// Navigation styling
export const NavigationWrapper = styled.div`
  margin-bottom: 1rem;
`;
