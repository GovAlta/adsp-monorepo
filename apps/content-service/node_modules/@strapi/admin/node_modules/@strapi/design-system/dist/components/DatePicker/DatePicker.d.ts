import * as React from 'react';
import { CalendarDate } from '@internationalized/date';
import { FlexProps } from '../../primitives/Flex';
import { Field } from '../Field';
interface DatePickerContextValue {
    calendarDate: CalendarDate;
    content: DatePickerContentElement | null;
    contentId: string;
    disabled: boolean;
    locale: string;
    minDate: CalendarDate;
    maxDate: CalendarDate;
    open: boolean;
    onCalendarDateChange: (date: CalendarDate) => void;
    onContentChange: (content: DatePickerContentElement | null) => void;
    onOpenChange: (isOpen: boolean) => void;
    onTextInputChange: (textInput: DatePickerTextInputElement | null) => void;
    onTextValueChange: (textValue: string) => void;
    onTriggerChange: (trigger: DatePickerTriggerElement | null) => void;
    onValueChange: (value: CalendarDate | undefined) => void;
    onClear?: (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => void;
    required: boolean;
    textInput: DatePickerTextInputElement | null;
    textValue?: string;
    timeZone: string;
    trigger: DatePickerTriggerElement | null;
    value?: CalendarDate;
}
interface DatePickerProps extends Pick<Partial<DatePickerContextValue>, 'disabled' | 'locale'>, Pick<CalendarProps, 'monthSelectLabel' | 'yearSelectLabel'>, Omit<TextInputProps, 'onChange' | 'value' | 'ref' | 'size'> {
    calendarLabel?: string;
    className?: string;
    minDate?: Date;
    maxDate?: Date;
    /**
     * @default Now
     */
    initialDate?: Date;
    /**
     * onChange function, passed from a parent component, it takes the actual date value and it is used inside the different handlers related to the change event for the DatePicker and the TimePicker and also the clear event for the TimePicker
     */
    onChange?: (date: Date | undefined) => void;
    onClear?: (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => void;
    clearLabel?: string;
    /**
     * @default
     */
    size?: 'S' | 'M';
    value?: Date;
}
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLInputElement>>;
type DatePickerTriggerElement = HTMLDivElement;
type DatePickerTextInputElement = HTMLInputElement;
interface TextInputProps extends React.ComponentPropsWithRef<'input'>, Pick<Field.InputProps, 'hasError'> {
}
type DatePickerContentElement = DatePickerContentImplElement;
type DatePickerContentImplElement = HTMLDivElement;
interface CalendarProps extends FlexProps<'div'> {
    monthSelectLabel?: string;
    yearSelectLabel?: string;
}
type DatePickerElement = DatePickerTextInputElement;
export { DatePicker };
export type { DatePickerProps, DatePickerElement };
//# sourceMappingURL=DatePicker.d.ts.map