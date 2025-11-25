import { FormProps } from '@strapi/admin/strapi-admin';
import { FieldsProps } from './Fields';
import type { EditFieldLayout, EditLayout } from '../../hooks/useDocumentLayout';
interface ConfigurationFormProps extends Pick<FieldsProps, 'attributes' | 'fieldSizes'> {
    layout: EditLayout;
    onSubmit: FormProps<ConfigurationFormData>['onSubmit'];
}
/**
 * Every key in EditFieldLayout is turned to optional never and then we overwrite the ones we are using.
 */
type EditFieldSpacerLayout = {
    [key in keyof Omit<EditFieldLayout, 'name' | 'size'>]?: never;
} & {
    description?: never;
    editable?: never;
    name: '_TEMP_';
    size: number;
    __temp_key__: string;
};
interface ConfigurationFormData extends Pick<EditLayout, 'settings'> {
    layout: Array<{
        __temp_key__: string;
        children: Array<(Pick<EditFieldLayout, 'label' | 'size' | 'name' | 'placeholder' | 'mainField'> & {
            description: EditFieldLayout['hint'];
            editable: EditFieldLayout['disabled'];
            __temp_key__: string;
        }) | EditFieldSpacerLayout>;
    }>;
}
declare const ConfigurationForm: ({ attributes, fieldSizes, layout: editLayout, onSubmit, }: ConfigurationFormProps) => import("react/jsx-runtime").JSX.Element;
export { ConfigurationForm };
export type { ConfigurationFormProps, ConfigurationFormData, EditFieldSpacerLayout };
