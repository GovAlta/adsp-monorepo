import { ComponentType } from 'react';
import type { Internal, Struct } from '@strapi/types';
interface DynamicZoneListProps {
    addComponent: (name?: string) => void;
    components: Array<Internal.UID.Component>;
    customRowComponent?: ComponentType<any>;
    name?: string;
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
    disabled?: boolean;
}
export declare const DynamicZoneList: ({ components, addComponent, name, forTarget, targetUid, disabled, }: DynamicZoneListProps) => import("react/jsx-runtime").JSX.Element;
export {};
