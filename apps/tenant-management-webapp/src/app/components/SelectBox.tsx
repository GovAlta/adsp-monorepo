import React, { useState } from 'react';
import styled from 'styled-components';
import { GoACheckbox } from '@abgov/react-components';

interface SelectBoxProps {
  values: string[];
  labels: string[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  disabled?: boolean;
}

interface BoxRowProps {
  value: string;
  label: string;
  checked: boolean;
  changeFunc: (value: string) => void;
  disabled?: boolean;
}

const BoxRowContainer = styled.div`
  display: flex;
  line-height: 2.5em;
  .goa-checkbox input[type='checkbox'] {
    display: none !important;
  }
`;

interface BoxRowTextProps {
  checked?: boolean;
}
const BoxRowText = styled.div<BoxRowTextProps>`
  color: ${(props) => (props.checked === true ? 'var(--color-gray-900)' : 'var(--color-gray-500)')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 12em;
`;

const BoxRow = ({ value, label, checked, changeFunc, disabled }: BoxRowProps): JSX.Element => {
  return (
    <BoxRowContainer>
      <GoACheckbox
        name={`select-box-check-${label}`}
        checked={checked}
        onChange={() => {
          changeFunc(value);
        }}
        disabled={disabled}
      />
      <BoxRowText checked={checked && !disabled}>{label}</BoxRowText>
    </BoxRowContainer>
  );
};

const SelectBoxContainer = styled.div`
  height: 10em;
  overflow: scroll;
  max-width: 16em;
`;

export const SelectBox = (props: SelectBoxProps): JSX.Element => {
  const [SelectedValues, setSelectedValues] = useState<string[]>(props.selectedValues);
  return (
    <SelectBoxContainer>
      {props.values.map((value, index): JSX.Element => {
        return (
          <BoxRow
            label={props.labels[index]}
            value={value}
            disabled={props.disabled}
            checked={SelectedValues.includes(value)}
            key={`select-box-row-${value}`}
            changeFunc={(_value: string) => {
              if (SelectedValues.includes(_value)) {
                const newValues = SelectedValues.filter((selectedValue) => {
                  return selectedValue !== _value;
                });
                setSelectedValues(newValues);
                props.onChange(newValues);
              } else {
                SelectedValues.push(_value);
                const newValues = [...SelectedValues];
                setSelectedValues(newValues);
                props.onChange(newValues);
              }
            }}
          />
        );
      })}
    </SelectBoxContainer>
  );
};
