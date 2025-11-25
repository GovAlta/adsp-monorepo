/// <reference types="react" />
import { IconButtonComponent } from '@strapi/design-system';
export declare const MainButtons: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<any, never>> | (import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<any, never>> & Omit<any, keyof import("react").Component<any, {}, any>>);
export declare const MoreButton: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<import("@strapi/design-system").TransientBoxProps & {
    children?: import("react").ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<"button"> & Omit<Omit<import("react").DetailedHTMLProps<import("react").ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: ((instance: HTMLButtonElement | null) => void) | import("react").RefObject<HTMLButtonElement> | null | undefined;
} & import("@strapi/design-system").TransientFlexProps & Pick<import("@strapi/design-system").ButtonProps, "size" | "variant"> & {
    children: import("react").ReactNode;
    disabled?: boolean | undefined;
    label: string;
    onClick?: import("react").MouseEventHandler<HTMLButtonElement> | undefined;
    withTooltip?: boolean | undefined;
}, never>> & Omit<IconButtonComponent, keyof import("react").Component<any, {}, any>>;
export declare const IconButtonGroupMargin: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<any, never>> | (import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<any, never>> & Omit<any, keyof import("react").Component<any, {}, any>>);
export declare const ExpandButton: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").ButtonProps<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>>, "ref"> & import("react").RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | import("react").RefObject<unknown> | null | undefined;
}, never>> & Omit<(<C extends import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements> = "button">(props: import("react").PropsWithoutRef<import("@strapi/design-system").ButtonProps<C>> & import("react").RefAttributes<unknown>) => import("react").ReactNode), keyof import("react").Component<any, {}, any>>;
