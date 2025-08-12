export interface Item {
  label: string;
  value: string;
}

export interface DropdownProps {
  items: Array<Item>;
  label: string;
  selected: string;
  enabled: boolean;
  optionListMaxHeight?: string;
  onChange: (value: string) => void;
  isAutoCompletion?: boolean;
  id?: string;
  width: string;
}

export interface GoADropdownTextboxProps {
  isOpen: boolean;
}

export interface GoADropdownListContainerWrapperProps {
  isOpen: boolean;
}

export interface GoADropdownListContainerProps {
  optionListMaxHeight?: string;
}

export interface GoADropdownListOptionProps {
  isSelected: boolean;
}
export interface GoAInputDropDownProps {
  isAutoCompletion: boolean;
}

export const ENTER_KEY = 'Enter';
export const ESCAPE_KEY = 'Escape';
export const ARROW_DOWN_KEY = 'ArrowDown';
export const ARROW_UP_KEY = 'ArrowUp';
export const TAB_KEY = 'Tab';
export const SPACE_KEY = ' ';
export const ALT_KEY = 'Alt';

export const SHIFT_KEY = 'Shift';
