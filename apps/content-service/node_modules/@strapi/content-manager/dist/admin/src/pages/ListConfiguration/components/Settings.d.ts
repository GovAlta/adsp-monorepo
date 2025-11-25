import { type InputProps } from '@strapi/admin/strapi-admin';
import { type MessageDescriptor } from 'react-intl';
import type { DistributiveOmit } from 'react-redux';
export type InputPropsWithMessageDescriptors = DistributiveOmit<InputProps, 'hint' | 'label' | 'placeholder'> & {
    hint?: MessageDescriptor;
    label: MessageDescriptor;
    placeholder?: MessageDescriptor;
};
/**
 * @internal
 * @description Form inputs are always displayed in a grid, so we need
 * to use the size property to determine how many columns the input should
 * take up.
 */
export type FormLayoutInputProps = InputPropsWithMessageDescriptors & {
    size: number;
};
declare const Settings: () => import("react/jsx-runtime").JSX.Element;
export { Settings };
