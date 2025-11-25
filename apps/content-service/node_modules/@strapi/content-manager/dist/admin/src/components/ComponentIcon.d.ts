import * as React from 'react';
import { FlexProps } from '@strapi/design-system';
import type { Struct } from '@strapi/types';
interface ComponentIconProps extends FlexProps {
    showBackground?: boolean;
    icon?: Struct.ContentTypeSchemaInfo['icon'];
}
declare const ComponentIcon: ({ showBackground, icon, ...props }: ComponentIconProps) => import("react/jsx-runtime").JSX.Element;
declare const COMPONENT_ICONS: Record<string, React.ComponentType<any>>;
export { ComponentIcon, COMPONENT_ICONS };
export type { ComponentIconProps };
