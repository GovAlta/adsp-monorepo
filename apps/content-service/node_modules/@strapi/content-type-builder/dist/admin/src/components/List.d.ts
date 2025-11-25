/// <reference types="react" />
import type { Component, ContentType } from '../types';
import type { UID } from '@strapi/types';
export declare const ListGrid: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: import("react").ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
}, "ref"> & {
    ref?: any;
}, never>> & Omit<import("@strapi/design-system").BoxComponent<"div">, keyof import("react").Component<any, {}, any>>;
type ListProps = {
    addComponentToDZ?: () => void;
    firstLoopComponentUid?: UID.Component | null;
    isFromDynamicZone?: boolean;
    isMain?: boolean;
    secondLoopComponentUid?: UID.Component | null;
    isSub?: boolean;
    type: ContentType | Component;
};
export declare const List: ({ addComponentToDZ, firstLoopComponentUid, isFromDynamicZone, isMain, isSub, secondLoopComponentUid, type, }: ListProps) => import("react/jsx-runtime").JSX.Element;
export {};
