/// <reference types="react" />
interface TextAreaProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
    placeholder?: string;
}
export declare const ResizableTextArea: ({ value, onChange, onSubmit, placeholder }: TextAreaProps) => import("react/jsx-runtime").JSX.Element;
export {};
