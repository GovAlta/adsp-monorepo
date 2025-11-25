import * as React from 'react';
import { Schema } from '@strapi/types';
type PreviewInputProps = Pick<Required<React.InputHTMLAttributes<HTMLInputElement>>, 'onFocus' | 'onBlur'>;
export declare function usePreviewInputManager(name: string, attribute: Schema.Attribute.AnyAttribute): PreviewInputProps;
export {};
