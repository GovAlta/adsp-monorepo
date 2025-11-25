import * as React from 'react';
import { InputProps } from '@strapi/admin/strapi-admin';
import { type EditFieldLayout } from '../../../../../hooks/useDocumentLayout';
import { DynamicZoneLabelProps } from './DynamicZoneLabel';
import type { InputRendererProps } from '../../InputRenderer';
interface DynamicZoneContextValue {
    isInDynamicZone: boolean;
}
declare const useDynamicZone: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: DynamicZoneContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface DynamicZoneProps extends Omit<Extract<EditFieldLayout, {
    type: 'dynamiczone';
}>, 'size' | 'hint'>, Pick<InputProps, 'hint'>, Pick<DynamicZoneLabelProps, 'labelAction'> {
    children?: (props: InputRendererProps) => React.ReactNode;
}
declare const DynamicZone: ({ attribute, disabled: disabledProp, hint, label, labelAction, name, required, children, }: DynamicZoneProps) => import("react/jsx-runtime").JSX.Element;
export { DynamicZone, useDynamicZone };
export type { DynamicZoneProps };
