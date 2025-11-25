interface FilterValueInputProps {
    label?: string;
    onChange: (value: string) => void;
    options?: {
        label?: string;
        value: string;
    }[];
    type?: string;
    value?: string;
}
export declare const FilterValueInput: ({ label, onChange, options, type, value, }: FilterValueInputProps) => import("react/jsx-runtime").JSX.Element;
export {};
