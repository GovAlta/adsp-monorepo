import styled from 'styled-components';
import {
  GoADropdownListContainerProps,
  GoADropdownListContainerWrapperProps,
  GoADropdownListOptionProps,
  GoADropdownTextboxProps,
} from './DropDownTypes';

export const GoADropdownTextbox = styled.div<GoADropdownTextboxProps>`
  border-radius: var(--goa-space-2xs);
  box-shadow: ${(p) => (p.isOpen ? `0 0 0 3px var(--goa-color-interactive-focus)` : '')};
  &:hover {
    cursor: pointer;
  }

  .inputStyle {
    box-shadow: ${(p) => (p.isOpen ? `0 0 0 3px var(--goa-color-interactive-focus) !important` : '')};
  }
`;

export const GoADropdownListContainerWrapper = styled.div<GoADropdownListContainerWrapperProps>`
  position: relative;
  display: ${(p) => !p?.isOpen && 'none'};
`;

export const GoADropdownListContainer = styled.div<GoADropdownListContainerProps>`
  border: solid 1px var(--goa-color-greyscale-200);
  border-radius: var(--goa-space-2xs);
  background: var(--goa-color-greyscale-white);
  padding: 0;
  margin-top: 3px;
  width: 100%;
  overflow-y: auto;
  z-index: 1000;
  caret-color: transparent;
  position: absolute;
  line-height: var(--goa-space-xl);
  max-height: ${(p) => p.optionListMaxHeight || '272px'};

  &:focus-visible {
    outline-color: var(--goa-color-interactive-default);
  }
  &:hover {
    background-color: var(--goa-color-interactive-hover) !important;
    color: #fff !important;
    /* Fix to override scrollbar color in Firefox */
    scrollbar-color: #a8a8a8 var(--goa-color-greyscale-100) !important;
  }
`;

export const GoADropdownListOption = styled.div<GoADropdownListOptionProps>`
  padding: var(--goa-space-2xs) var(--goa-space-s);
  text-overflow: ellipsis;
  color: ${(p) => (p.isSelected ? '#fff' : 'var(--goa-color-greyscale-black)')} !important;
  border: 0px solid var(--goa-color-greyscale-100);
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
    background-color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-hover)' : 'var(--goa-color-greyscale-100) !important'};
  }
  &:focus-within {
    caret-color: transparent;
    color: #fff !important;
    background-color: ${(p) =>
      p.isSelected ? 'var(--goa-color-interactive-hover)' : 'var(--goa-color-greyscale-100) !important'};
  }
  .dropDownListItem:focus-visible {
    caret-color: transparent;
    outline: none !important;
    color: ${(p) => (p.isSelected ? '#fff' : 'var(--goa-color-interactive-hover) !important')};
  }
`;

export const LabelItem = styled.span`
  font: var(--goa-dropdown-typography);
`;
