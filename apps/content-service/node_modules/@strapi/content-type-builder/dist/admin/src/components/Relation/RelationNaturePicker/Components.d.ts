/// <reference types="react" />
import { BoxComponent, FlexComponent } from '@strapi/design-system';
declare const Wrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: import("react").ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
}, "ref"> & {
    ref?: any;
}, never>> & Omit<BoxComponent, keyof import("react").Component<any, {}, any>>;
declare const IconWrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").Substitute<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: import("react").ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
}, "ref"> & {
    ref?: any;
}, {
    $isSelected: boolean;
}>> & Omit<BoxComponent<"button">, keyof import("react").Component<any, {}, any>>;
declare const InfosWrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").FlexProps<"div">, "ref"> & import("react").RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | import("react").RefObject<unknown> | null | undefined;
}, never>> & Omit<FlexComponent, keyof import("react").Component<any, {}, any>>;
export { IconWrapper, InfosWrapper, Wrapper };
