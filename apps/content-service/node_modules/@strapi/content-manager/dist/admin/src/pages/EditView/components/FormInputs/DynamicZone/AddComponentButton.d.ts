import * as React from 'react';
interface AddComponentButtonProps {
    children: React.ReactNode;
    hasError?: boolean;
    isDisabled?: boolean;
    isOpen?: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement> & React.MouseEventHandler<HTMLDivElement>;
}
declare const AddComponentButton: ({ hasError, isDisabled, isOpen, children, onClick, }: AddComponentButtonProps) => import("react/jsx-runtime").JSX.Element;
export { AddComponentButton };
export type { AddComponentButtonProps };
