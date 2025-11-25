interface RelationProps {
    formErrors: Record<string, any>;
    mainBoxHeader: string;
    modifiedData: Record<string, any>;
    onChange: (value: any) => void;
    naturePickerType: string;
    targetUid: string;
}
export declare const Relation: ({ formErrors, mainBoxHeader, modifiedData, naturePickerType, onChange, targetUid, }: RelationProps) => import("react/jsx-runtime").JSX.Element;
export {};
