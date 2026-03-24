import React from 'react';
import styled from 'styled-components';

interface CheckboxProps {
  checked: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onChange: () => void;
}

const Label = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  gap: var(--goa-space-xs);
  margin-top: 3px;
`;

const HiddenInput = styled.input`
  opacity: 0;
  position: absolute;
  pointer-events: none;
`;

const Box = styled.span<{ checked: boolean; disabled: boolean }>`
  width: 24px;
  height: 24px;
  border: var(--goa-border-width-s) solid
    ${({ checked }) => (checked ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-700)')};
  background-color: ${({ checked }) =>
    checked ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-white)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.1s ease,
    border-color 0.1s ease;
  margin-bottom: var(--goa-space-xs);
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &::after {
    content: ${({ checked }) => (checked ? "''" : 'none')};
    width: 9px;
    height: 16px;
    border: solid var(--goa-color-greyscale-white);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  &:hover {
    background-color: ${({ checked, disabled }) =>
      disabled ? undefined : checked ? 'var(--goa-color-interactive-hover)' : undefined};
    border-color: ${({ checked, disabled }) =>
      disabled ? undefined : checked ? 'var(--goa-color-interactive-hover)' : undefined};
  }
`;

export const Checkbox: React.FC<CheckboxProps> = ({ checked, disabled = false, ariaLabel, onChange }) => (
  <Label>
    <HiddenInput type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel} onChange={onChange} />
    <Box checked={checked} disabled={disabled} />
  </Label>
);
