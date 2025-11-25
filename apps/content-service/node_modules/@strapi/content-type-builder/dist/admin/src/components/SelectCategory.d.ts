interface SelectCategoryProps {
    error?: string | null;
    intlLabel: {
        id: string;
        defaultMessage: string;
        values?: Record<string, any>;
    };
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: any;
            type: string;
        };
    }) => void;
    value?: string;
    isCreating?: boolean;
    dynamicZoneTarget?: string | null;
}
export declare const SelectCategory: ({ error, intlLabel, name, onChange, value, isCreating, dynamicZoneTarget, }: SelectCategoryProps) => import("react/jsx-runtime").JSX.Element;
export {};
