/// <reference types="react" />
declare const Wrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").FlexProps<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>>, "ref"> & import("react").RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | import("react").RefObject<unknown> | null | undefined;
}, never>> & Omit<(<C extends import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements> = "div">(props: import("react").PropsWithoutRef<import("@strapi/design-system").FlexProps<C>> & import("react").RefAttributes<unknown>) => import("react").ReactNode), keyof import("react").Component<any, {}, any>>;
export { Wrapper };
