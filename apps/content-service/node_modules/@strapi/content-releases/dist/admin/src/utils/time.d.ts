export declare const getTimezoneOffset: (timezone: string, date: Date) => string;
interface ITimezoneOption {
    offset: string;
    value: string;
}
export declare const getTimezones: (selectedDate: Date) => {
    timezoneList: ITimezoneOption[];
    systemTimezone: ITimezoneOption | undefined;
};
export {};
