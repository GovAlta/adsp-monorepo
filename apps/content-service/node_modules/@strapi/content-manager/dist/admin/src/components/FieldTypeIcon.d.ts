import * as React from 'react';
import type { Schema } from '@strapi/types';
declare const iconByTypes: Record<Schema.Attribute.Kind, React.ReactElement>;
interface FieldTypeIconProps {
    type?: keyof typeof iconByTypes;
    customFieldUid?: string;
}
declare const FieldTypeIcon: ({ type, customFieldUid }: FieldTypeIconProps) => React.ReactElement<any, string | React.JSXElementConstructor<any>> | null;
export { FieldTypeIcon };
