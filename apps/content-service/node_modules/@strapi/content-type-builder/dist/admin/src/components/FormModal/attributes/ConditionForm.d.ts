interface ConditionFormProps {
    name: string;
    value: any;
    onChange: (e: {
        target: {
            name: string;
            value: any;
        };
    }) => void;
    onDelete: () => void;
    attributeName?: string;
    conditionFields?: Array<{
        name: string;
        type: string;
        enum?: string[];
    }>;
    allAttributes?: Array<{
        name: string;
        type: string;
    }>;
}
export declare const ConditionForm: ({ name, value, onChange, onDelete, attributeName, conditionFields, }: ConditionFormProps) => import("react/jsx-runtime").JSX.Element;
export {};
