/// <reference types="react" />
/**
 * Translates and fades in from a specified direction.
 */
export declare const AnimatedBox: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").Substitute<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: import("react").ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
}, "ref"> & {
    ref?: any;
}, {
    $direction?: "left" | "up" | undefined;
}>> & Omit<import("@strapi/design-system").BoxComponent<"div">, keyof import("react").Component<any, {}, any>>;
