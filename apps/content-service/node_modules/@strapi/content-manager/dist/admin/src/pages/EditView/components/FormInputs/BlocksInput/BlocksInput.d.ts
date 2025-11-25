import * as React from 'react';
import { type InputProps } from '@strapi/admin/strapi-admin';
import type { Schema } from '@strapi/types';
interface BlocksInputProps extends Omit<InputProps, 'type'> {
    labelAction?: React.ReactNode;
    type: Schema.Attribute.Blocks['type'];
}
declare const MemoizedBlocksInput: React.MemoExoticComponent<React.ForwardRefExoticComponent<BlocksInputProps & React.RefAttributes<{
    focus: () => void;
}>>>;
export { MemoizedBlocksInput as BlocksInput };
