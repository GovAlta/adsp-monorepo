import { ButtonProps } from '@strapi/design-system';
import * as yup from 'yup';
import { CreateLocale } from '../../../shared/contracts/locales';
interface CreateLocaleProps extends Pick<ButtonProps, 'disabled' | 'variant'> {
}
declare const CreateLocale: ({ disabled, variant }: CreateLocaleProps) => import("react/jsx-runtime").JSX.Element;
declare const LOCALE_SCHEMA: yup.default<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    code: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    name: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    isDefault: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    code: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    name: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    isDefault: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    code: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    name: import("yup/lib/string").RequiredStringSchema<string | null | undefined, Record<string, any>>;
    isDefault: yup.BooleanSchema<boolean | undefined, Record<string, any>, boolean | undefined>;
}>>>;
declare const SubmitButton: () => import("react/jsx-runtime").JSX.Element;
interface BaseFormProps {
    mode?: 'create' | 'edit';
}
declare const BaseForm: ({ mode }: BaseFormProps) => import("react/jsx-runtime").JSX.Element | null;
type AdvancedFormProps = {
    isDefaultLocale?: boolean;
};
declare const AdvancedForm: ({ isDefaultLocale }: AdvancedFormProps) => import("react/jsx-runtime").JSX.Element;
export { CreateLocale, BaseForm, AdvancedForm, SubmitButton, LOCALE_SCHEMA };
