import React, { useEffect, useState, useRef } from 'react';
import { GoAInput, GoAInputProps } from '@abgov/react-components';
import { isEqual } from 'lodash';
import {
  ALT_KEY,
  ARROW_DOWN_KEY,
  ARROW_UP_KEY,
  DropdownProps,
  ENTER_KEY,
  ESCAPE_KEY,
  Item,
  SHIFT_KEY,
  SPACE_KEY,
  TAB_KEY,
} from './DropDownTypes';
import {
  GoADropdownListContainer,
  GoADropdownListContainerWrapper,
  GoADropdownListOption,
  GoADropdownTextbox,
  LabelItem,
} from './styled-components';

export const isValidKey = (keyCode: string): boolean => {
  if (keyCode === SHIFT_KEY || keyCode === ALT_KEY) return false;

  const regex = new RegExp(/^[a-zA-Z0-9!%$@.#?\-_]+$/);
  return regex.test(keyCode);
};

export const Dropdown = (props: DropdownProps): JSX.Element => {
  const { label, selected, onChange, optionListMaxHeight, isAutoCompletion, enabled, id, width } = props;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>(selected);
  const [items, setItems] = useState(props.items);
  const [inputText, setInputText] = useState<string>(selected);
  const prevCountRef = useRef(props.items);

  const trailingIcon = isOpen ? 'chevron-up' : 'chevron-down';
  const textInputName = `dropdown-${label}`;
  const textInput = document.getElementsByName(textInputName)[0] ?? null;

  const PREFIX = 'jsonforms-dropdown';

  useEffect(() => {
    setItems(props.items);
    prevCountRef.current = props.items;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEqual(props.items, prevCountRef.current)]);

  useEffect(() => {
    if (textInput) {
      textInput.addEventListener('keydown', handleKeyDown);
      textInput.addEventListener('blur', handleTextInputOnBlur);
    }
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      if (textInput) {
        textInput.removeEventListener('keydown', handleKeyDown);
        textInput.removeEventListener('blur', handleTextInputOnBlur);
      }
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput, document]);

  /* istanbul ignore next */
  const handleTextInputOnBlur = (e: FocusEvent) => {
    if (e.relatedTarget === null) {
      setIsOpen(false);
    } else if (e.relatedTarget && !isAutoCompletion) {
      const dropDownEl = e.relatedTarget as HTMLDivElement;
      if (dropDownEl) {
        if (!dropDownEl.id.startsWith(`${PREFIX}-${label}`)) {
          setIsOpen(false);
        }
      }
    }
  };

  const updateDropDownData = (item: Item) => {
    onChange(item.value);
    setSelectedOption(item.value);
    setInputText(item.label);

    if (isAutoCompletion) {
      const selectedItems = props.items.filter((filterItem) => {
        return filterItem.label === item.label;
      });
      setItems(selectedItems);
    }
    setIsOpen(false);
  };

  const setInputTextFocus = () => {
    const inputEl = document.getElementById(`${id}-input`) as GoAInputProps & HTMLElement;

    if (inputEl) {
      //The 'focused' property is part of the GoAInput component that is used to
      //set focus on the input field. We need to set it back to false once we set focus on the input field. Doing with just .focus() doesnt work.
      inputEl.focused = true;
      inputEl.focus();
      inputEl.focused = false;
    }
  };

  const setElementFocus = (
    e: KeyboardEvent | React.KeyboardEvent<HTMLElement>,
    element: HTMLElement | null,
    preventDefault: boolean
  ) => {
    if (element) {
      element.focus();

      if (preventDefault) {
        e.preventDefault();
      }
    }
  };

  /* istanbul ignore next */
  const handleDocumentKeyDown = (e: KeyboardEvent) => {
    if (e.key === ESCAPE_KEY || e.key === TAB_KEY) {
      setIsOpen(false);
    }
  };

  /* istanbul ignore next */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ENTER_KEY || e.key === SPACE_KEY) {
      setIsOpen((previousIsOpen) => !previousIsOpen);
      const el = document.getElementById(`${PREFIX}-${label}-${items.at(0)?.value}`);

      setInputTextFocus();
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
      if (firstItem?.label.trim() === '') {
        index = 1;
      }
      let el = document.getElementById(`${PREFIX}-${label}-${props.items.at(index)?.value}`);

      if (el === null && !isAutoCompletion) {
        const elements = document.querySelectorAll(`[id='${PREFIX}-dropDownList-${label}']`);
        const element = elements.item(0).children.item(1) as HTMLElement;
        el = document.getElementById(`${PREFIX}-${label}-${element.innerText}`);
      } else if (el === null && isAutoCompletion) {
        const elements = document.querySelectorAll(`[id=${PREFIX}-dropDownList-${label}]`);
        const element = elements[0].children[0] as HTMLElement;
        el = document.getElementById(`${PREFIX}-${label}-${element.innerText}`);
      }
      setElementFocus(e, el, true);
    } else if (e.key === ESCAPE_KEY || e.key === TAB_KEY) {
      setIsOpen(false);
    } else {
      if (isValidKey(e.key)) {
        setIsOpen(true);
      }
    }
  };

  const handDropDownItemOnKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, item: Item) => {
    if (e.key === ENTER_KEY || e.key === SPACE_KEY) {
      updateDropDownData(item);
      setInputTextFocus();
    }
    if (e.key === ESCAPE_KEY) {
      setIsOpen(false);
      setInputTextFocus();
    }

    let index = items.findIndex((val) => {
      return val.label === e.currentTarget.innerText;
    });

    //Prevent jumping to the next control/DOM element if
    //we are on the last item in the drop down list
    if (e.key === ARROW_DOWN_KEY) {
      if (item.label === items.at(-1)?.label) {
        e.preventDefault();
      }

      if (index === -1 && item.label.trim() === '') {
        index = 0;
      }

      const el = document.getElementById(`${PREFIX}-${label}-${items.at(index + 1)?.value}`);
      if (el) {
        setElementFocus(e, el, true);
        return;
      }
    }
    if (e.key === ARROW_UP_KEY) {
      if (index <= 0) {
        e.preventDefault();
        return;
      }

      const el = document.getElementById(`${PREFIX}-${label}-${items.at(index - 1)?.value}`);
      if (el) {
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
    <div data-testid={id} key={id} style={{ width: width || '100%' }}>
      <GoADropdownTextbox
        isOpen={isOpen}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          setIsOpen((previousIsOpen) => !previousIsOpen);
        }}
      >
        <GoAInput
          disabled={!enabled}
          name={`dropdown-${label}`}
          width="100%"
          value={inputText}
          testId={`${id}-input`}
          id={`${id}-input`}
          readonly={!isAutoCompletion}
          onChange={(name, value) => {
            if (isAutoCompletion) {
              setInputText(value);
              const selectedItems = props.items.filter((item) => {
                return item.label.includes(value);
              });
              setItems(selectedItems);
            }
          }}
          onTrailingIconClick={() => {}}
          trailingIcon={trailingIcon}
        />
      </GoADropdownTextbox>
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
                  className="dropDownListItem"
                  data-testid={`${id}-${item.label}-option`}
                  id={`${PREFIX}-${label}-${item.value}`}
                  key={`${PREFIX}-${label}-${item.value}`}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    handDropDownItemOnKeyDown(e, item);
                  }}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    updateDropDownData(item);
                  }}
                >
                  <LabelItem>{item.label}</LabelItem>
                </div>
              </GoADropdownListOption>
            );
          })}
        </GoADropdownListContainer>
      </GoADropdownListContainerWrapper>
    </div>
  );
};
