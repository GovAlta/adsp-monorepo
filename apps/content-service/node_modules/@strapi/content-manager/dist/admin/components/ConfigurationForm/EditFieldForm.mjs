import { jsx, jsxs } from 'react/jsx-runtime';
import { useNotification, useField, Form, InputRenderer } from '@strapi/admin/strapi-admin';
import { Modal, Flex, Grid, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD } from '../../constants/attributes.mjs';
import { useGetInitialDataQuery } from '../../services/init.mjs';
import { capitalise } from '../../utils/strings.mjs';
import { getTranslation } from '../../utils/translations.mjs';
import { FieldTypeIcon } from '../FieldTypeIcon.mjs';
import { TEMP_FIELD_NAME } from './Fields.mjs';

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------------------------*/ const FIELD_SCHEMA = yup.object().shape({
    label: yup.string().required().nullable(),
    description: yup.string(),
    editable: yup.boolean(),
    size: yup.number().required()
});
const EditFieldForm = ({ attribute, name, onClose })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { value, onChange } = useField(name);
    const { data: mainFieldOptions } = useGetInitialDataQuery(undefined, {
        selectFromResult: (res)=>{
            if (attribute?.type !== 'relation' || !res.data) {
                return {
                    data: []
                };
            }
            if ('targetModel' in attribute && typeof attribute.targetModel === 'string') {
                const targetSchema = res.data.contentTypes.find((schema)=>schema.uid === attribute.targetModel);
                if (targetSchema) {
                    return {
                        data: Object.entries(targetSchema.attributes).reduce((acc, [key, attribute])=>{
                            /**
               * Create the list of attributes from the schema as to which can
               * be our `mainField` and dictate the display name of the schema
               * we're editing.
               */ if (!ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD.includes(attribute.type)) {
                                acc.push({
                                    label: key,
                                    value: key
                                });
                            }
                            return acc;
                        }, [])
                    };
                }
            }
            return {
                data: []
            };
        },
        skip: attribute?.type !== 'relation'
    });
    if (!value || value.name === TEMP_FIELD_NAME || !attribute) {
        // This is very unlikely to happen, but it ensures the form is not opened without a value.
        console.error("You've opened a field to edit without it being part of the form, this is likely a bug with Strapi. Please open an issue.");
        toggleNotification({
            message: formatMessage({
                id: 'content-manager.containers.edit-settings.modal-form.error',
                defaultMessage: 'An error occurred while trying to open the form.'
            }),
            type: 'danger'
        });
        return null;
    }
    return /*#__PURE__*/ jsx(Modal.Content, {
        children: /*#__PURE__*/ jsxs(Form, {
            method: "PUT",
            initialValues: value,
            validationSchema: FIELD_SCHEMA,
            onSubmit: (data)=>{
                onChange(name, data);
                onClose();
            },
            children: [
                /*#__PURE__*/ jsx(Modal.Header, {
                    children: /*#__PURE__*/ jsxs(Flex, {
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsx(FieldTypeIcon, {
                                type: attribute.type
                            }),
                            /*#__PURE__*/ jsx(Modal.Title, {
                                children: formatMessage({
                                    id: 'content-manager.containers.edit-settings.modal-form.label',
                                    defaultMessage: 'Edit {fieldName}'
                                }, {
                                    fieldName: capitalise(value.name)
                                })
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsx(Modal.Body, {
                    children: /*#__PURE__*/ jsx(Grid.Root, {
                        gap: 4,
                        children: [
                            {
                                name: 'label',
                                label: formatMessage({
                                    id: getTranslation('containers.edit-settings.modal-form.label'),
                                    defaultMessage: 'Label'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'description',
                                label: formatMessage({
                                    id: getTranslation('containers.edit-settings.modal-form.description'),
                                    defaultMessage: 'Description'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'placeholder',
                                label: formatMessage({
                                    id: getTranslation('containers.edit-settings.modal-form.placeholder'),
                                    defaultMessage: 'Placeholder'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'editable',
                                label: formatMessage({
                                    id: getTranslation('containers.edit-settings.modal-form.editable'),
                                    defaultMessage: 'Editable'
                                }),
                                size: 6,
                                type: 'boolean'
                            },
                            {
                                name: 'mainField',
                                label: formatMessage({
                                    id: getTranslation('containers.edit-settings.modal-form.mainField'),
                                    defaultMessage: 'Entry title'
                                }),
                                hint: formatMessage({
                                    id: getTranslation('containers.SettingPage.edit-settings.modal-form.mainField.hint'),
                                    defaultMessage: 'Set the displayed field'
                                }),
                                size: 6,
                                options: mainFieldOptions,
                                type: 'enumeration'
                            },
                            {
                                name: 'size',
                                label: formatMessage({
                                    id: getTranslation('containers.ListSettingsView.modal-form.size'),
                                    defaultMessage: 'Size'
                                }),
                                size: 6,
                                options: [
                                    {
                                        value: '4',
                                        label: '33%'
                                    },
                                    {
                                        value: '6',
                                        label: '50%'
                                    },
                                    {
                                        value: '8',
                                        label: '66%'
                                    },
                                    {
                                        value: '12',
                                        label: '100%'
                                    }
                                ],
                                type: 'enumeration'
                            }
                        ].filter(filterFieldsBasedOnAttributeType(attribute.type)).map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                col: size,
                                direction: "column",
                                alignItems: "stretch",
                                children: /*#__PURE__*/ jsx(InputRenderer, {
                                    ...field
                                })
                            }, field.name))
                    })
                }),
                /*#__PURE__*/ jsxs(Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsx(Modal.Close, {
                            children: /*#__PURE__*/ jsx(Button, {
                                variant: "tertiary",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'Cancel'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Button, {
                            type: "submit",
                            children: formatMessage({
                                id: 'global.finish',
                                defaultMessage: 'Finish'
                            })
                        })
                    ]
                })
            ]
        })
    });
};
/**
 * @internal
 * @description not all edit fields have the same editable properties, it depends on the type
 * e.g. a dynamic zone can only change it's label.
 */ const filterFieldsBasedOnAttributeType = (type)=>(field)=>{
        switch(type){
            case 'blocks':
            case 'richtext':
                return field.name !== 'size' && field.name !== 'mainField';
            case 'boolean':
            case 'media':
                return field.name !== 'placeholder' && field.name !== 'mainField';
            case 'component':
            case 'dynamiczone':
                return field.name === 'label' || field.name === 'editable';
            case 'json':
                return field.name !== 'placeholder' && field.name !== 'mainField' && field.name !== 'size';
            case 'relation':
                return true;
            default:
                return field.name !== 'mainField';
        }
    };

export { EditFieldForm };
//# sourceMappingURL=EditFieldForm.mjs.map
