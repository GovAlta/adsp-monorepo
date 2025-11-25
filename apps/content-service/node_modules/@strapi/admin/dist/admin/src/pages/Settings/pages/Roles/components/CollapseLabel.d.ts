/// <reference types="react" />
import { FlexComponent } from '@strapi/design-system';
declare const CollapseLabel: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").Substitute<Omit<Omit<import("@strapi/design-system").FlexProps<"div">, "ref"> & import("react").RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | import("react").RefObject<unknown> | null | undefined;
}, {
    $isCollapsable: boolean;
}>> & Omit<FlexComponent, keyof import("react").Component<any, {}, any>>;
export { CollapseLabel };
