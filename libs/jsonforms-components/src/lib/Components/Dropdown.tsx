import React, { useEffect, useState, useRef } from 'react';
import { GoAInput } from '@abgov/react-components-new';
import { isEqual } from 'lodash';
import { ARROW_DOWN_KEY, ARROW_UP_KEY, DropdownProps, ENTER_KEY, ESCAPE_KEY, Item, TAB_KEY } from './DropDownTypes';
import { GoADropdownListContainer, GoADropdownListContainerWrapper, GoADropdownListOption } from './styled-components';

export const Dropdown = (props: DropdownProps): JSX.Element => {
  const { label, selected, onChange, optionListMaxHeight, isAutocompletion, id } = props;
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>(selected);
  const [items, setItems] = useState(props.items);
  const [inputText, setInputText] = useState<string>(selected);
  const prevCountRef = useRef(props.items);
  const trailingIcon = isOpen ? 'chevron-up' : 'chevron-down';
  const textInputName = `dropdown-${label}` || '';
  const textInput = document.getElementsByName(textInputName)[0] ?? null;

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
    setIsOpen(!isOpen);
  }

  function updateDropDownData(item: Item) {
    onChange(item.value);
    setSelectedOption(item.value);
    setInputText(item.label);
    setIsOpen(false);
  }

  function keyDown(e: KeyboardEvent) {
    if (!isAutocompletion) {
      handleKeyDownWithNoAutoCompletion(e);
    } else {
      //TO DO: Handle auto completion.
    }
  }

  function handleKeyDownOnAutoCompletion(e: KeyboardEvent) {}

  function handleKeyDownWithNoAutoCompletion(e: KeyboardEvent) {
    if (e.key === ENTER_KEY) {
      setIsOpen(!isOpen);
      const val = `jsonforms-dropdown-${label}-${items.at(0)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
      }
    } else if (e.key === ARROW_UP_KEY) {
      setIsOpen(true);
      const val = `jsonforms-dropdown-${label}-${items.at(1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
      }
    } else if (e.key === ARROW_DOWN_KEY) {
      setIsOpen(true);
      const firstItem = items.at(0);
      let index = 0;
      if (firstItem?.label === '' || firstItem?.label.trim() === '') {
        index = 1;
      }

      const val = `jsonforms-dropdown-${label}-${items.at(index)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
        e.preventDefault();
      }
    } else if (e.key === ESCAPE_KEY) {
      setIsOpen(false);
    } else if (e.key === TAB_KEY) {
      setIsOpen(false);
    }
  }

  function handDropDownItemOnKeyDown(e: React.KeyboardEvent<HTMLDivElement>, item: Item) {
    if (e.key === ENTER_KEY) {
      updateDropDownData(item);
    }
    if (e.key === ESCAPE_KEY) {
      setIsOpen(false);
    }

    let index = items.findIndex((val) => {
      return val.label === e.currentTarget.innerText;
    });

    //Prevent jumping to the next control or element if
    //we are on the last item in the drop down list
    if (e.key === ARROW_DOWN_KEY) {
      if (item.label === items.at(-1)?.label) {
        e.preventDefault();
      }
      if (index === -1 && item.label.trim() === '') {
        index = 0;
      }

      const val = `jsonforms-dropdown-${label}-${items.at(index + 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
        e.preventDefault();
      }
    }
    if (e.key === ARROW_UP_KEY) {
      if (index <= 0) {
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
        setIsOpen(false);
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
        <GoADropdownListContainer id="dropDownList" optionListMaxHeight={optionListMaxHeight}>
          {items.map((item) => {
            return (
              <GoADropdownListOption isSelected={item.value === selected}>
                <div
                  tabIndex={0}
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
                    updateDropDownData(item);
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
