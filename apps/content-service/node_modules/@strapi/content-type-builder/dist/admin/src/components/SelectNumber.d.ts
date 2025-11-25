type SelectNumberProps = {
    intlLabel: {
        id: string;
        defaultMessage: string;
        values?: object;
    };
    error?: string;
    modifiedData: {
        default: number;
        max: number;
        min: number;
    };
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string | number | null;
            type?: string;
        };
    }) => void;
    options: Array<{
        metadatas: {
            intlLabel: {
                id: string;
                defaultMessage: string;
            };
            disabled?: boolean;
            hidden?: boolean;
        };
        key: string | number;
        value: string | number;
    }>;
    value?: string;
};
export declare const SelectNumber: ({ intlLabel, error, modifiedData, name, onChange, options, value, }: SelectNumberProps) => import("react/jsx-runtime").JSX.Element;
export {};
