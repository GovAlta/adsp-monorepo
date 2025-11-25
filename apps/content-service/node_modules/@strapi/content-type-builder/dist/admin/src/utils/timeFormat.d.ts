type TimeChangeHandler = (params: {
    target: {
        name: string;
        value: string | undefined;
        type: string;
    };
}) => void;
type TimeChangeParams = {
    value?: string;
    onChange: TimeChangeHandler;
    name: string;
    type: string;
};
export declare const handleTimeChange: ({ value }: TimeChangeParams) => string | undefined;
export declare const handleTimeChangeEvent: (onChange: TimeChangeHandler, name: string, type: string, time?: string) => void;
export {};
