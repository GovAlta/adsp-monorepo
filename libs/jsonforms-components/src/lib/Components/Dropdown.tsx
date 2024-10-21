import React, { useEffect, useState, useRef } from 'react';
import { GoAInput } from '@abgov/react-components-new';
import styled from 'styled-components';
import { isEqual } from 'lodash';

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
  isAutocompletion?: boolean;
  id?: string;
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

interface GoADropdownListContainerWrapperProps {
  isOpen: boolean;
}

const GoADropdownListContainerWrapper = styled.div<GoADropdownListContainerWrapperProps>`
  position: relative;
  display: ${(p) => !p?.isOpen && 'none'};
`;

interface GoADropdownListContainerProps {
  optionListMaxHeight?: string;
}

interface GoADropdownListOptionProps {
  isSelected: boolean;
}
interface GoAInputDropDownProps {
  isAutoCompletion: boolean;
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

const GoADropdownListOption = styled.div<GoADropdownListOptionProps>`
  padding: 4px 12px;
  text-overflow: ellipsis;
  color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-greyscale-black)')} !important;
  border: 0px solid #f1f1f1;

  z-index: 1001;
  cursor: pointer;
  background: ${(p) => (p.isSelected ? 'var(--goa-color-interactive-default)' : '#fff')};
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
    color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-greyscale-black)')} !important;

    background-color: var(--goa-color-interactive-hover) !important;
  }
  .dropDownClass:focus-visible {
    caret-color: transparent;
    color: ${(p) => (p.isSelected ? 'white' : 'var(--goa-color-interactive-hover) !important')};
  }
`;
export const Dropdown = (props: DropdownProps): JSX.Element => {
  const { label, selected, onChange, optionListMaxHeight, isAutocompletion, id } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>(selected);
  const [items, setItems] = useState(props.items);
  const [inputText, setInputText] = useState<string>(selected);
  const [tabIndex, setTabIndex] = useState<number>(0);
  const prevCountRef = useRef(props.items);

  const trailingIcon = isOpen ? 'chevron-up' : 'chevron-down';
  const textInputName = `dropdown-${label}` || '';
  const textInput = document.getElementsByName(textInputName)[0] ?? null;

  const ENTER_KEY = 'Enter';
  const ESCAPE_KEY = 'Escape';
  const ARROW_DOWN_KEY = 'ArrowDown';
  const ARROW_UP_KEY = 'ArrowUp';
  const TAB_KEY = 'Tab';

  useEffect(() => {
    if (textInput) {
      textInput.addEventListener('click', inputTextOnClick);
      textInput.addEventListener('keydown', keyDown, false);
    }
    return () => {
      if (textInput) {
        textInput.removeEventListener('click', inputTextOnClick);
        textInput.removeEventListener('keydown', keyDown, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput]);

  function inputTextOnClick(e: MouseEvent) {
    console.log('mouse clicked', e);
    setIsOpen(!isOpen);
  }

  function keyDown(e: KeyboardEvent) {
    if (e.key === ENTER_KEY) {
      setIsOpen(!isOpen);
    } else if (e.key === ARROW_DOWN_KEY) {
      setIsOpen(true);
      const val = `jsonforms-dropdown-${label}-${items.at(0)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        // el.style.outline = 'none';
        el.focus();
      }
    } else if (e.key === ESCAPE_KEY) {
      setIsOpen(false);
    } else if (e.key === TAB_KEY) {
      setIsOpen(false);
    }
  }

  function handDropDownItemOnKeyDown(e: React.KeyboardEvent<HTMLDivElement>, item: Item) {
    if (e.key === ENTER_KEY) {
      onChange(item.value);
      setSelectedOption(item.value);
      setInputText(item.label);
      setIsOpen(false);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }

    const index = items.findIndex((val) => {
      return val.label === e.currentTarget.innerText;
    });

    //Prevent jumping to the next control or element if
    //we are on the last item in the drop down
    if (e.key === ARROW_DOWN_KEY) {
      if (item.label === items.at(-1)?.label) {
        e.preventDefault();
      }

      const val = `jsonforms-dropdown-${label}-${items.at(index + 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
      }
    }
    if (e.key === ARROW_UP_KEY) {
      if (index === 0) {
        e.preventDefault();
        return;
      }

      const val = `jsonforms-dropdown-${label}-${items.at(index - 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
      }
    }

    if (e.key === TAB_KEY) {
      const val = `jsonforms-dropdown-${label}-${items.at(index - 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        const nextSibling = el.nextSibling as HTMLElement;
        nextSibling.focus();
      }
    }
  }

  useEffect(() => {
    setItems(props.items);
    prevCountRef.current = props.items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEqual(props.items, prevCountRef.current)]);

  return (
    <div data-testid={id}>
      <GoAInput
        onTrailingIconClick={() => {
          setIsOpen(!isOpen);
        }}
        name={`dropdown-${label}`}
        width="100%"
        value={inputText}
        testId={`${id}-input`}
        id={`${id}-input`}
        readonly={!isAutocompletion}
        onChange={(name, value) => {
          if (isAutocompletion) {
            const selectedItems = props.items.filter((item) => {
              return item.label.includes(value);
            });
            setItems(selectedItems);
            setIsOpen(true);
          }
        }}
        trailingIcon={trailingIcon}
        onFocus={() => {
          setIsOpen(!isOpen);
        }}
      />
      <GoADropdownListContainerWrapper isOpen={isOpen}>
        <GoADropdownListContainer optionListMaxHeight={optionListMaxHeight}>
          {items.map((item) => {
            return (
              <GoADropdownListOption isSelected={item.value === selected}>
                <div
                  tabIndex={tabIndex}
                  data-testid={`${id}-${item.label}-option`}
                  id={`jsonforms-dropdown-${label}-${item.value}`}
                  key={`jsonforms-dropdown-${label}-${item.value}`}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    handDropDownItemOnKeyDown(e, item);
                  }}
                  onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
                    const currentElement = document.getElementById(e.currentTarget.id);
                    const parentElement = document.getElementById(e.currentTarget.id)?.parentElement;
                    if (currentElement) {
                      currentElement.style.outline = 'none';
                    }
                    if (parentElement) {
                      if (item.value !== selected) {
                        parentElement.style.backgroundColor = 'var(--goa-color-greyscale-100) !important';
                      }
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                    const currentElement = document.getElementById(e.currentTarget.id);
                    const parentElement = document.getElementById(e.currentTarget.id)?.parentElement;
                    if (currentElement) {
                      currentElement.style.backgroundColor = '';
                      currentElement.style.outline = 'none';
                      currentElement.style.color = 'var(--goa-color-interactive-default !important';
                    }

                    if (parentElement) {
                      parentElement.style.backgroundColor = '';
                    }
                  }}
                  onClick={() => {
                    onChange(item.value);
                    setSelectedOption(item.value);
                    setInputText(item.label);
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
    </div>
  );
};
