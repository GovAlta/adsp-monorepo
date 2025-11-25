import { ComponentType, SVGProps } from 'react';
declare const iconByTypes: Record<string, ComponentType<SVGProps<SVGSVGElement>>>;
export type IconByType = keyof typeof iconByTypes;
type AttributeIconProps = {
    type: IconByType;
    customField?: string | null;
};
export declare const AttributeIcon: ({ type, customField, ...rest }: AttributeIconProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
