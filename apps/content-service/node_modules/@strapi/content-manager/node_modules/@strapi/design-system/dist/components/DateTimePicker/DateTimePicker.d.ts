import * as React from 'react';
import { CalendarDateTime } from '@internationalized/date';
import { DatePickerProps } from '../DatePicker/DatePicker';
import { TimePickerProps } from '../TimePicker';
export interface DateTimePickerProps extends Omit<DatePickerProps, 'step' | 'onChange' | 'value'>, Pick<TimePickerProps, 'step'> {
    /**
     * Label for the DatePicker field
     * @default "Date"
     */
    dateLabel?: string;
    /**
     * Label for the TimePicker field
     * @default "Time"
     */
    timeLabel?: string;
    onChange?: (date: Date | undefined) => void;
    /**
     * Value. The Date passed as value
     */
    value?: Date | null;
}
export declare const DateTimePicker: React.ForwardRefExoticComponent<DateTimePickerProps & React.RefAttributes<HTMLInputElement>>;
export declare const convertUTCDateToCalendarDateTime: (date: Date, resetTime?: boolean) => CalendarDateTime;
//# sourceMappingURL=DateTimePicker.d.ts.map