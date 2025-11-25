import * as React from 'react';
import { ComboboxProps } from '../Combobox/Combobox';
export interface TimePickerProps extends Omit<ComboboxProps, 'children' | 'autocomplete' | 'startIcon' | 'placeholder' | 'allowCustomValue' | 'onFilterValueChange' | 'filterValue' | 'value' | 'defaultValue' | 'defaultTextValue' | 'textValue' | 'onTextValueChange'> {
    /**
     * @default 15
     */
    step?: number;
    value?: string;
    defaultValue?: string;
}
export declare const TimePicker: React.ForwardRefExoticComponent<TimePickerProps & React.RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=TimePicker.d.ts.map