interface TabFormProps {
    form: Array<Record<string, any>>;
    formErrors: Record<string, any>;
    genericInputProps: Record<string, any>;
    modifiedData: Record<string, any>;
    onChange: (value: any) => void;
}
export declare const TabForm: ({ form, formErrors, genericInputProps, modifiedData, onChange, }: TabFormProps) => import("react/jsx-runtime").JSX.Element;
export {};
