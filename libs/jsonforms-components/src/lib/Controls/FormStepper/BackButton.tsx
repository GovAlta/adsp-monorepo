import React from 'react';
import styled, { css } from 'styled-components';

interface ExternalLinkProps {
  text: string;
  link: () => void;
  testId?: string;
  showBackIcon?: boolean;
}

const StyledBackButton = styled.button<{ $showBackIcon?: boolean }>`
  align-items: center;
  background: none;
  border: 0;
  color: var(--goa-color-interactive-default, #0070c4);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  margin: 0;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: currentColor;
  text-underline-offset: 2px;

  &:hover,
  &:visited {
    color: #004f84;
  }

  &:focus {
    outline: 2px solid var(--goa-color-interactive-default, #0070c4);
    outline-offset: 2px;
  }

  ${({ $showBackIcon }) =>
    $showBackIcon &&
    css`
      margin-top: var(--goa-space-m);
      margin-bottom: var(--goa-space-m);

      &::before {
        content: '';
        display: inline-block;
        width: 42px;
        height: 24px;
        vertical-align: middle;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 22 22" fill="none" stroke="%230070C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>')
          center center no-repeat;
      }

      &:hover::before,
      &:visited::before {
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 22 22" fill="none" stroke="%23004f84" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>')
          center center no-repeat;
      }
    `}
`;

export const BackButton = ({ text, testId, link, showBackIcon = true }: ExternalLinkProps): JSX.Element => {
  return (
    <StyledBackButton
      type="button"
      $showBackIcon={showBackIcon}
      data-testid={testId || 'back-button-click'}
      onClick={link}
    >
      {text}
    </StyledBackButton>
  );
};
