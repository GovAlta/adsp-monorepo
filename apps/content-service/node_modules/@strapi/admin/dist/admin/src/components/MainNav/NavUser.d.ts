/// <reference types="react" />
export interface NavUserProps {
    initials?: string;
    children?: React.ReactNode;
    showDisplayName?: boolean;
}
export declare const NavUser: ({ initials, showDisplayName, children, ...props }: NavUserProps) => import("react/jsx-runtime").JSX.Element;
