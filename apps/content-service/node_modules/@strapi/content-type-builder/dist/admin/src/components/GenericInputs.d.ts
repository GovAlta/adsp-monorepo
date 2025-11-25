/**
 * TODO: we should be using the FormRenderer from the admin to do this,
 * but the CTB has no tests or types, so we can't refactor it safely.
 * So we're just adding this to the tech debt.
 */
import * as React from 'react';
import { type MessageDescriptor, type PrimitiveType } from 'react-intl';
import type { Schema } from '@strapi/types';
interface TranslationMessage extends MessageDescriptor {
    values?: Record<string, PrimitiveType>;
}
interface InputOption {
    metadatas: {
        intlLabel: TranslationMessage;
        disabled: boolean;
        hidden: boolean;
    };
    key: string;
    value: string;
}
interface CustomInputProps<TAttribute extends Schema.Attribute.AnyAttribute = Schema.Attribute.AnyAttribute> {
    attribute?: TAttribute;
    autoComplete?: string;
    description?: TranslationMessage;
    disabled?: boolean;
    error?: string;
    hint?: string | React.JSX.Element | (string | React.JSX.Element)[];
    intlLabel: TranslationMessage;
    labelAction?: React.ReactNode;
    name: string;
    onChange: (payload: {
        target: {
            name: string;
            value: Schema.Attribute.Value<TAttribute>;
            type?: string;
        };
    }, shouldSetInitialValue?: boolean) => void;
    onDelete?: () => void;
    options?: InputOption[];
    placeholder?: TranslationMessage;
    required?: boolean;
    step?: number;
    type: string;
    value?: Schema.Attribute.Value<TAttribute>;
    autoFocus?: boolean;
    attributeName?: string;
    conditionFields?: Record<string, boolean>;
}
interface GenericInputProps<TAttribute extends Schema.Attribute.AnyAttribute = Schema.Attribute.AnyAttribute> {
    attribute?: TAttribute;
    autoComplete?: string;
    customInputs?: Record<string, React.ComponentType<CustomInputProps<TAttribute>>>;
    description?: TranslationMessage;
    disabled?: boolean;
    error?: string | TranslationMessage;
    intlLabel: TranslationMessage;
    labelAction?: React.ReactNode;
    name: string;
    onChange: (payload: {
        target: {
            name: string;
            value: Schema.Attribute.Value<TAttribute>;
            type?: string;
        };
    }, shouldSetInitialValue?: boolean) => void;
    onDelete?: () => void;
    options?: InputOption[];
    placeholder?: TranslationMessage;
    required?: boolean;
    step?: number;
    type: string;
    value?: Schema.Attribute.Value<TAttribute>;
    isNullable?: boolean;
    autoFocus?: boolean;
    attributeName?: string;
    conditionFields?: Record<string, boolean>;
}
/**
 * we've memoized this component because we use a context to store all the data in our form in the content-manager.
 * This then causes _every_ component to re-render because there are no selects incurring performance issues
 * in content-types as the content-type gets more complicated.
 */
declare const MemoizedGenericInput: React.MemoExoticComponent<({ autoComplete, customInputs, description, disabled, intlLabel, labelAction, error, name, onChange, onDelete, options, placeholder, required, step, type, value: defaultValue, isNullable, autoFocus, attribute, attributeName, conditionFields, ...rest }: GenericInputProps) => import("react/jsx-runtime").JSX.Element>;
export type { GenericInputProps, CustomInputProps };
export { MemoizedGenericInput as GenericInput };
