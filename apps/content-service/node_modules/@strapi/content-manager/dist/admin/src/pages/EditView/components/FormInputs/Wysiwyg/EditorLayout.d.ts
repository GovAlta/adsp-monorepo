import * as React from 'react';
interface EditorLayoutProps {
    children: React.ReactNode;
    isExpandMode: boolean;
    error?: string;
    previewContent?: string;
    onCollapse: () => void;
}
declare const EditorLayout: ({ children, isExpandMode, error, previewContent, onCollapse, }: EditorLayoutProps) => import("react/jsx-runtime").JSX.Element;
declare const ExpandButton: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").ButtonProps<React.ElementType<any, keyof React.JSX.IntrinsicElements>>, "ref"> & React.RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | React.RefObject<unknown> | null | undefined;
}, never>> & Omit<(<C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("@strapi/design-system").ButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode), keyof React.Component<any, {}, any>>;
export { EditorLayout, ExpandButton };
export type { EditorLayoutProps };
