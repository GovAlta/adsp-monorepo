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

  const PREFIX = 'jsonforms-dropdown';

  useEffect(() => {
    setItems(props.items);
    prevCountRef.current = props.items;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEqual(props.items, prevCountRef.current)]);

  useEffect(() => {
    if (textInput) {
      textInput.addEventListener('click', inputTextOnClick);
      textInput.addEventListener('keydown', keyDown);
      textInput.addEventListener('blur', handleTextOnBlur);

      textInput.addEventListener('mouseout', handleTextOnMouseOut);
      textInput.addEventListener('focusout', handleTextOnFocusOut);
    }
    return () => {
      if (textInput) {
        textInput.removeEventListener('click', inputTextOnClick);
        textInput.removeEventListener('keydown', keyDown);
        textInput.removeEventListener('mouseout', handleTextOnMouseOut);
        textInput.removeEventListener('focusout', handleTextOnFocusOut);
        textInput.removeEventListener('blur', handleTextOnBlur);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput]);

  const handleTextOnBlur = (e: FocusEvent) => {
    console.log(`text on blur`);
    e.preventDefault();
  };

  const handleTextOnMouseOut = (e: MouseEvent) => {};

  const handleTextOnFocusOut = (e: FocusEvent) => {};

  const inputTextOnClick = (e: MouseEvent) => {
    setIsOpen(!isOpen);
  };

  const updateDropDownData = (item: Item) => {
    onChange(item.value);
    setSelectedOption(item.value);
    setInputText(item.label);

    if (isAutocompletion) {
      const selectedItems = props.items.filter((filterItem) => {
        return filterItem.label === item.label;
      });
      setItems(selectedItems);
    }
    setIsOpen(false);
  };

  const setElementFocus = (e: KeyboardEvent, element: HTMLElement | null, preventDefault: boolean) => {
    if (element) {
      element.style.outline = 'none';
      element.focus();

      if (preventDefault) {
        e.preventDefault();
      }
    }
  };

  const keyDown = (e: KeyboardEvent) => {
    handleKeyDown(e);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ENTER_KEY) {
      setIsOpen(!isOpen);
      const val = `${PREFIX}-${label}-${items.at(0)?.value}`;
      const el = document.getElementById(val);
      setElementFocus(e, el, false);
    } else if (e.key === ARROW_UP_KEY) {
      setIsOpen(true);
      const val = `${PREFIX}-${label}-${items.at(1)?.value}`;
      const el = document.getElementById(val);
      setElementFocus(e, el, false);
    } else if (e.key === ARROW_DOWN_KEY) {
      setIsOpen(true);
      const firstItem = props.items.at(0);

      let index = 0;
      if (firstItem?.label === '' || firstItem?.label.trim() === '') {
        index = 1;
      }
      const val = `${PREFIX}-${label}-${props.items.at(index)?.value}`;
      let el = document.getElementById(val);

      //If we cant find the items in the items useState object try looking for it in the DOM element
      if (el === null) {
        const elements = document.querySelectorAll(`[id=${PREFIX}-dropDownList-${label}]`);
        const element = elements.item(0).children.item(1) as HTMLElement;
        el = document.getElementById(`${PREFIX}-${label}-${element.innerText}`);
      }
      setElementFocus(e, el, true);
    } else if (e.key === ESCAPE_KEY || e.key === TAB_KEY) {
      setIsOpen(false);
    }
  };

  const handDropDownItemOnKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, item: Item) => {
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

      const val = `${PREFIX}-${label}-${items.at(index + 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
        e.preventDefault();
        return;
      }
    }
    if (e.key === ARROW_UP_KEY) {
      if (index <= 0) {
        e.preventDefault();
        return;
      }

      const val = `${PREFIX}-${label}-${items.at(index - 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        el.style.outline = 'none';
        el.focus();
      }
    }

    if (e.key === TAB_KEY) {
      const val = `${PREFIX}-${label}-${items.at(index - 1)?.value}`;
      const el = document.getElementById(val);
      if (el) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div data-testid={id} key={id}>
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
      />
      <GoADropdownListContainerWrapper
        isOpen={isOpen}
        id={`${PREFIX}-dropDownListContainerWrapper-${label}`}
        key={`${PREFIX}-dropDownListContainerWrapper-${label}`}
      >
        <GoADropdownListContainer
          key={`${PREFIX}-dropDownList-${label}`}
          id={`${PREFIX}-dropDownList-${label}`}
          optionListMaxHeight={optionListMaxHeight}
        >
          {items.map((item) => {
            return (
              <GoADropdownListOption
                key={`${PREFIX}-option-${label}-${item.value}`}
                id={`${PREFIX}-option-${label}-${item.value}`}
                isSelected={item.value === selected || item.value === selectedOption}
              >
                <div
                  tabIndex={0}
                  data-testid={`${id}-${item.label}-option`}
                  id={`${PREFIX}-${label}-${item.value}`}
                  key={`${PREFIX}-${label}-${item.value}`}
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
                      if (item.value !== selected && item.value !== selectedOption) {
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
