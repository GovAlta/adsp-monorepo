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
  gap: var(--goa-checkbox-gap);
`;

const HiddenInput = styled.input`
  opacity: 0;
  position: absolute;
  pointer-events: none;
`;

const Box = styled.span<{ checked: boolean; disabled: boolean }>`
  width: var(--goa-checkbox-size);
  height: var(--goa-checkbox-size);
  min-width: var(--goa-checkbox-size);
  min-height: var(--goa-checkbox-size);
  border: ${({ checked }) =>
    checked ? 'var(--goa-border-width-s) solid var(--goa-color-interactive-default)' : 'var(--goa-checkbox-border)'};
  border-radius: var(--goa-checkbox-border-radius);
  background-color: ${({ checked }) =>
    checked ? 'var(--goa-checkbox-color-bg-checked)' : 'var(--goa-checkbox-color-bg)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.1s ease,
    border-color 0.1s ease;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    border: ${({ disabled }) => (disabled ? undefined : 'var(--goa-checkbox-border-hover)')};
    background-color: ${({ checked, disabled }) =>
      disabled ? undefined : checked ? 'var(--goa-checkbox-color-bg-checked-hover)' : undefined};
  }
`;

const Checkmark = styled.svg`
  fill: var(--goa-checkbox-color-bg);
  margin: 3px;
`;

export const Checkbox: React.FC<CheckboxProps> = ({ checked, disabled = false, ariaLabel, onChange }) => (
  <Label>
    <HiddenInput type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel} onChange={onChange} />
    <Box checked={checked} disabled={disabled}>
      {checked && (
        <Checkmark xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 12.18">
          <path d="M5.09,9.64,1.27,5.82,0,7.09l5.09,5.09L16,1.27,14.73,0Z" />
        </Checkmark>
      )}
    </Box>
  </Label>
);
