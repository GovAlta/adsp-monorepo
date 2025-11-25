/// <reference types="react" />
import { Box, Flex } from '@strapi/design-system';
export interface InputContextValue {
    isLoading?: boolean;
}
export declare const InputContext: import("react").Context<InputContextValue>;
export declare const useInput: () => InputContextValue;
export interface InputRootProps extends React.ComponentPropsWithoutRef<typeof Flex> {
    children: React.ReactNode;
    isLoading?: boolean;
}
export declare const Root: ({ children, isLoading, ...props }: InputRootProps) => import("react/jsx-runtime").JSX.Element;
interface HeaderProps extends React.ComponentPropsWithoutRef<typeof Box> {
    children: React.ReactNode;
    isThinking?: boolean;
    thinkingMessage?: string;
}
interface InputAttachmentsProps extends React.ComponentPropsWithoutRef<typeof Flex> {
    children: React.ReactNode;
}
interface ContentProps extends React.ComponentPropsWithoutRef<typeof Box> {
    children: React.ReactNode;
    disclaimer?: string;
    error?: boolean;
}
export declare const Input: {
    Root: ({ children, isLoading, ...props }: InputRootProps) => import("react/jsx-runtime").JSX.Element;
    Header: ({ children, ...props }: HeaderProps) => import("react/jsx-runtime").JSX.Element;
    HeaderItem: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<import("@strapi/design-system").TransientBoxProps & {
        children?: import("react").ReactNode;
    } & import("@strapi/design-system/dist/types").AsProp<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
        ref?: any;
    }, "ref"> & {
        ref?: any;
    }, never>> & Omit<import("@strapi/design-system").BoxComponent<"div">, keyof import("react").Component<any, {}, any>>;
    Attachments: ({ children, gap, ...props }: InputAttachmentsProps) => import("react/jsx-runtime").JSX.Element;
    Content: ({ children, disclaimer, error, ...props }: ContentProps) => import("react/jsx-runtime").JSX.Element;
    Actions: ({ children }: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    useInput: () => InputContextValue;
};
export {};
