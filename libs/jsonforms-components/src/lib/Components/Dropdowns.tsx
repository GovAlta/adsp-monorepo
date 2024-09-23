import React, { useState } from 'react';
import { GoAInput } from '@abgov/react-components-new';
import styled from 'styled-components';

export interface Item {
  label: string;
  value: string;
}

interface DropdownProps {
  items: Array<Item>;
  label: string;
  selected: string;
  optionListMaxHeight?: string;
  onChange: (value: string) => void;
}

interface GoADropdownTextboxProps {
  isOpen: boolean;
}

const GoADropdownTextbox = styled.div<GoADropdownTextboxProps>`
  text-overflow: ellipsis;
  overflow: hidden;
  min-height: 43px;
  box-sizing: border-box;
  width: 100%;
  padding: 8px;
  padding-right: 8px;
  border-radius: 4px;
  border: 1px solid #666;
  font-size: 18px;
  font-weight: 400;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  box-shadow: ${(p) => (p.isOpen ? `0 0 0 3px #feba35` : '')};
`;

const GoADropdownListContainerWrapper = styled.div`
  position: relative;
`;

interface GoADropdownListContainerProps {
  optionListMaxHeight?: string;
}

const GoADropdownListContainer = styled.div<GoADropdownListContainerProps>`
  border: solid 1px #dcdcdc;
  border-radius: 4px;
  background: #fff;
  padding: 0;
  margin-top: 3px;
  width: 100%;
  overflow-y: auto;
  z-index: 1000;
  position: absolute;
  line-height: 2rem;
  max-height: ${(p) => p.optionListMaxHeight || '272px'};
`;

interface GoADropdownListOptionProps {
  isSelected: boolean;
}

const GoADropdownListOption = styled.div<GoADropdownListOptionProps>`
  padding: 4px 12px;
  text-overflow: ellipsis;
  color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-greyscale-black)')} !important;
  border: 1px solid #f1f1f1;
  background: ${(p) => (p.isSelected ? 'var(--goa-color-interactive-default)' : '#fff')};
  &:hover {
    background-color: ${(p) => (p.isSelected ? 'var(--goa-color-interactive-default)' : '#f1f1f1')};
    color: ${(p) => (p.isSelected ? 'white' : '#333')} !important;
  }
`;

export const Dropdown = (props: DropdownProps): JSX.Element => {
  const { items, label, selected, onChange, optionListMaxHeight } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>(selected);

  return (
    <>
      <GoADropdownTextbox
        isOpen={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {selected || ''}
      </GoADropdownTextbox>
      {isOpen && (
        <GoADropdownListContainerWrapper>
          <GoADropdownListContainer optionListMaxHeight={optionListMaxHeight}>
            {items.map((item) => {
              return (
                <GoADropdownListOption isSelected={item.value === selected}>
                  <div
                    onClick={() => {
                      onChange(item.value);
                      setIsOpen(false);
                    }}
                  >
                    {item.label}
                  </div>
                </GoADropdownListOption>
              );
            })}
          </GoADropdownListContainer>
        </GoADropdownListContainerWrapper>
      )}
    </>
  );
};
