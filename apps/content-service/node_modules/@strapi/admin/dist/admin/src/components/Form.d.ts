import * as React from 'react';
import { type BoxProps } from '@strapi/design-system';
import { type MessageDescriptor, type PrimitiveType } from 'react-intl';
import type { InputProps as InputPropsImpl, StringProps, EnumerationProps } from './FormInputs/types';
import type * as Yup from 'yup';
type InputProps = InputPropsImpl | StringProps | EnumerationProps;
interface TranslationMessage extends MessageDescriptor {
    values?: Record<string, PrimitiveType>;
}
interface FormValues {
    [field: string]: any;
}
interface FormContextValue<TFormValues extends FormValues = FormValues> extends FormState<TFormValues> {
    disabled: boolean;
    initialValues: TFormValues;
    modified: boolean;
    /**
     * The default behaviour is to add the row to the end of the array, if you want to add it to a
     * specific index you can pass the index.
     */
    addFieldRow: (field: string, value: any, addAtIndex?: number) => void;
    moveFieldRow: (field: string, fromIndex: number, toIndex: number) => void;
    onChange: (eventOrPath: React.ChangeEvent<any> | string, value?: any) => void;
    removeFieldRow: (field: string, removeAtIndex?: number) => void;
    resetForm: () => void;
    setErrors: (errors: FormErrors<TFormValues>) => void;
    setSubmitting: (isSubmitting: boolean) => void;
    setValues: (values: TFormValues) => void;
    validate: (shouldSetErrors?: boolean, options?: Record<string, string>) => Promise<{
        data: TFormValues;
        errors?: never;
    } | {
        data?: never;
        errors: FormErrors<TFormValues>;
    }>;
}
declare const useForm: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: FormContextValue<FormValues>) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface FormHelpers<TFormValues extends FormValues = FormValues> extends Pick<FormContextValue<TFormValues>, 'setErrors' | 'setValues' | 'resetForm'> {
}
interface FormProps<TFormValues extends FormValues = FormValues> extends Partial<Pick<FormContextValue<TFormValues>, 'disabled' | 'initialValues'>>, Pick<BoxProps, 'width' | 'height'> {
    children: React.ReactNode | ((props: Pick<FormContextValue<TFormValues>, 'disabled' | 'errors' | 'isSubmitting' | 'modified' | 'values' | 'resetForm' | 'onChange' | 'setErrors'>) => React.ReactNode);
    method: 'POST' | 'PUT';
    onSubmit?: (values: TFormValues, helpers: FormHelpers<TFormValues>) => Promise<void> | void;
    validationSchema?: Yup.AnySchema;
    initialErrors?: FormErrors<TFormValues>;
    validate?: (values: TFormValues, options: Record<string, string>) => Promise<any>;
}
/**
 * @alpha
 * @description A form component that handles form state, validation and submission.
 * It can additionally handle nested fields and arrays. To access the data you can either
 * use the generic useForm hook or the useField hook when providing the name of your field.
 */
declare const Form: <TFormValues extends FormValues>(p: FormProps<TFormValues> & {
    ref?: React.Ref<HTMLFormElement>;
}) => React.ReactElement;
/**
 * @description handy utility to convert a yup validation error into a form
 * error object. To be used elsewhere.
 */
declare const getYupValidationErrors: (err: Yup.ValidationError) => FormErrors;
type FormErrors<TFormValues extends FormValues = FormValues> = {
    [Key in keyof TFormValues]?: TFormValues[Key] extends any[] ? TFormValues[Key][number] extends object ? FormErrors<TFormValues[Key][number]>[] | string | string[] : string : TFormValues[Key] extends object ? FormErrors<TFormValues[Key]> : string | TranslationMessage;
};
interface FormState<TFormValues extends FormValues = FormValues> {
    /**
     * TODO: make this a better type explaining errors could be nested because it follows the same
     * structure as the values.
     */
    errors: FormErrors<TFormValues>;
    isSubmitting: boolean;
    values: TFormValues;
}
interface FieldValue<TValue = any> {
    error?: string;
    initialValue: TValue;
    onChange: (eventOrPath: React.ChangeEvent<any> | string, value?: TValue) => void;
    value: TValue;
    rawError?: any;
}
declare function useField<TValue = any>(path: string): FieldValue<TValue | undefined>;
/**
 * Props for the Blocker component.
 * @param onProceed Function to be called when the user confirms the action that triggered the blocker.
 * @param onCancel Function to be called when the user cancels the action that triggered the blocker.
 */
interface BlockerProps {
    onProceed?: () => void;
    onCancel?: () => void;
}
declare const Blocker: ({ onProceed, onCancel }: BlockerProps) => import("react/jsx-runtime").JSX.Element | null;
export { Form, Blocker, useField, useForm, getYupValidationErrors };
export type { FormErrors, FormHelpers, FormProps, FormValues, FormContextValue, FormState, FieldValue, InputProps, };
