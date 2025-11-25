import type { Internal, Struct } from '@strapi/types';
interface ComponentCardProps {
    component: string;
    dzName: string;
    index: number;
    isActive?: boolean;
    isInDevelopmentMode?: boolean;
    onClick?: () => void;
    forTarget: Struct.ModelType;
    targetUid: Internal.UID.Schema;
    disabled?: boolean;
}
export declare const ComponentCard: ({ component, dzName, index, isActive, isInDevelopmentMode, onClick, forTarget, targetUid, disabled, }: ComponentCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
