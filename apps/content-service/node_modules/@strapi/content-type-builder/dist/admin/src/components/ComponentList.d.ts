import type { UID } from '@strapi/types';
interface ComponentListProps {
    component: UID.Component;
    firstLoopComponentUid?: UID.Component | null;
    isFromDynamicZone?: boolean;
}
export declare const ComponentList: ({ component, isFromDynamicZone, firstLoopComponentUid, }: ComponentListProps) => import("react/jsx-runtime").JSX.Element | undefined;
export {};
