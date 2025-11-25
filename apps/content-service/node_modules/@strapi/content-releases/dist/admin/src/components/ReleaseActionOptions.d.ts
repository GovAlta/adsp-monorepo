import * as React from 'react';
interface ActionOptionProps {
    selected: 'publish' | 'unpublish';
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    disabled?: boolean;
}
export declare const ReleaseActionOptions: ({ selected, handleChange, name, disabled, }: ActionOptionProps) => import("react/jsx-runtime").JSX.Element;
export {};
