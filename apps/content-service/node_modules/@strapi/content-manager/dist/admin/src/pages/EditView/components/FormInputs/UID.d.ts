import * as React from 'react';
import { type InputProps } from '@strapi/admin/strapi-admin';
import type { Schema } from '@strapi/types';
interface UIDInputProps extends Omit<InputProps, 'type'> {
    attribute?: Pick<Schema.Attribute.UIDProperties, 'regex'>;
    type: Schema.Attribute.TypeOf<Schema.Attribute.UID>;
}
declare const MemoizedUIDInput: React.MemoExoticComponent<React.ForwardRefExoticComponent<UIDInputProps & React.RefAttributes<any>>>;
export { MemoizedUIDInput as UIDInput };
export type { UIDInputProps };
