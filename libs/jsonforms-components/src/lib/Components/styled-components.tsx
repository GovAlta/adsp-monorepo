import styled from 'styled-components';
import {
  GoADropdownListContainerProps,
  GoADropdownListContainerWrapperProps,
  GoADropdownListOptionProps,
  GoADropdownTextboxProps,
} from './DropDownTypes';

export const GoADropdownTextbox = styled.div<GoADropdownTextboxProps>`
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

export const GoADropdownListContainerWrapper = styled.div<GoADropdownListContainerWrapperProps>`
  position: relative;
  display: ${(p) => !p?.isOpen && 'none'};
`;

export const GoADropdownListContainer = styled.div<GoADropdownListContainerProps>`
  border: solid 1px #dcdcdc;
  border-radius: 4px;
  background: #fff;
  padding: 0;
  margin-top: 3px;
  width: 100%;
  overflow-y: auto;
  z-index: 1000;
  caret-color: transparent;
  position: absolute;
  line-height: 2rem;
  max-height: ${(p) => p.optionListMaxHeight || '272px'};

  &:focus-visible {
    outline-color: var(--goa-color-interactive-default);
  }
  &:hover {
    background-color: var(--goa-color-interactive-hover) !important;
    color: white !important;
  }
`;

export const GoADropdownListOption = styled.div<GoADropdownListOptionProps>`
  padding: 4px 12px;
  text-overflow: ellipsis;
  color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-greyscale-black)')} !important;
  border: 0px solid #f1f1f1;
  z-index: 1001;
  cursor: pointer;
  background: ${(p) => (p.isSelected ? 'var(--goa-color-interactive-default)' : '#fff')};
  :has(div:focus) {
    background-color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-hover)' : 'var(--goa-color-greyscale-100) !important'};
    color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-interactive-hover) !important'};
  }
  &:hover {
    background-color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-hover)' : 'var(--goa-color-greyscale-100) !important'};
    color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-interactive-hover) !important'};
  }

  &:focus-visible {
    caret-color: transparent;
    color: black !important;
    background-color: var(--goa-color-interactive-hover) !important;
  }
  &:focus-within {
    caret-color: transparent;
    color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-interactive-hover)')} !important;
    background-color: var(--goa-color-interactive-hover) !important;
  }
  .dropDownListItem:focus-visible {
    caret-color: transparent;
    outline: none !important;
    color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-interactive-hover) !important')};
  }
`;
