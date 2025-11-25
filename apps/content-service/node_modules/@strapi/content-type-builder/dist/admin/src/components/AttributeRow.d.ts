/// <reference types="react" />
import type { AnyAttribute, Component, ContentType } from '../types';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { UID } from '@strapi/types';
export declare const GridWrapper: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").Substitute<Omit<Omit<import("@strapi/design-system").FlexProps<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>>, "ref"> & import("react").RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | import("react").RefObject<unknown> | null | undefined;
}, {
    $isOverlay?: boolean | undefined;
    $isDragging?: boolean | undefined;
}>> & Omit<(<C extends import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements> = "div">(props: import("react").PropsWithoutRef<import("@strapi/design-system").FlexProps<C>> & import("react").RefAttributes<unknown>) => import("react").ReactNode), keyof import("react").Component<any, {}, any>>;
export type AttributeRowProps = {
    item: {
        id: string;
        index: number;
    } & AnyAttribute;
    firstLoopComponentUid?: UID.Component | null;
    isFromDynamicZone?: boolean;
    addComponentToDZ?: () => void;
    secondLoopComponentUid?: UID.Component | null;
    type: ContentType | Component;
    isDragging?: boolean;
    style?: Record<string, unknown>;
    listeners?: DraggableSyntheticListeners;
    attributes?: DraggableAttributes;
    isOverlay?: boolean;
    handleRef?: (element: HTMLElement | null) => void;
};
export declare const AttributeRow: import("react").ForwardRefExoticComponent<AttributeRowProps & import("react").RefAttributes<HTMLLIElement>>;
