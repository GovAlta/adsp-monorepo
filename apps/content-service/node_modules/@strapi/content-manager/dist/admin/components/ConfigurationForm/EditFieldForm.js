'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var yup = require('yup');
var attributes = require('../../constants/attributes.js');
var init = require('../../services/init.js');
var strings = require('../../utils/strings.js');
var translations = require('../../utils/translations.js');
var FieldTypeIcon = require('../FieldTypeIcon.js');
var Fields = require('./Fields.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------------------------*/ const FIELD_SCHEMA = yup__namespace.object().shape({
    label: yup__namespace.string().required().nullable(),
    description: yup__namespace.string(),
    editable: yup__namespace.boolean(),
    size: yup__namespace.number().required()
});
const EditFieldForm = ({ attribute, name, onClose })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { value, onChange } = strapiAdmin.useField(name);
    const { data: mainFieldOptions } = init.useGetInitialDataQuery(undefined, {
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
               */ if (!attributes.ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD.includes(attribute.type)) {
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
    if (!value || value.name === Fields.TEMP_FIELD_NAME || !attribute) {
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Form, {
            method: "PUT",
            initialValues: value,
            validationSchema: FIELD_SCHEMA,
            onSubmit: (data)=>{
                onChange(name, data);
                onClose();
            },
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(FieldTypeIcon.FieldTypeIcon, {
                                type: attribute.type
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                                children: formatMessage({
                                    id: 'content-manager.containers.edit-settings.modal-form.label',
                                    defaultMessage: 'Edit {fieldName}'
                                }, {
                                    fieldName: strings.capitalise(value.name)
                                })
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                        gap: 4,
                        children: [
                            {
                                name: 'label',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.edit-settings.modal-form.label'),
                                    defaultMessage: 'Label'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'description',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.edit-settings.modal-form.description'),
                                    defaultMessage: 'Description'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'placeholder',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.edit-settings.modal-form.placeholder'),
                                    defaultMessage: 'Placeholder'
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                name: 'editable',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.edit-settings.modal-form.editable'),
                                    defaultMessage: 'Editable'
                                }),
                                size: 6,
                                type: 'boolean'
                            },
                            {
                                name: 'mainField',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.edit-settings.modal-form.mainField'),
                                    defaultMessage: 'Entry title'
                                }),
                                hint: formatMessage({
                                    id: translations.getTranslation('containers.SettingPage.edit-settings.modal-form.mainField.hint'),
                                    defaultMessage: 'Set the displayed field'
                                }),
                                size: 6,
                                options: mainFieldOptions,
                                type: 'enumeration'
                            },
                            {
                                name: 'size',
                                label: formatMessage({
                                    id: translations.getTranslation('containers.ListSettingsView.modal-form.size'),
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
                        ].filter(filterFieldsBasedOnAttributeType(attribute.type)).map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                col: size,
                                direction: "column",
                                alignItems: "stretch",
                                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.InputRenderer, {
                                    ...field
                                })
                            }, field.name))
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Close, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                variant: "tertiary",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'Cancel'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

exports.EditFieldForm = EditFieldForm;
//# sourceMappingURL=EditFieldForm.js.map
