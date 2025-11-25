import * as React from 'react';
interface InitializerProps {
    disabled?: boolean;
    name: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement> & React.MouseEventHandler<HTMLDivElement>;
}
declare const Initializer: ({ disabled, name, onClick }: InitializerProps) => import("react/jsx-runtime").JSX.Element;
export { Initializer };
export type { InitializerProps };
