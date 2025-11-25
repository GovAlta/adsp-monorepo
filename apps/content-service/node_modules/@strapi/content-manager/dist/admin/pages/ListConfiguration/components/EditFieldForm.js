'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var yup = require('yup');
var FieldTypeIcon = require('../../../components/FieldTypeIcon.js');
var strings = require('../../../utils/strings.js');
var translations = require('../../../utils/translations.js');

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

const FIELD_SCHEMA = yup__namespace.object().shape({
    label: yup__namespace.string().required(),
    sortable: yup__namespace.boolean()
});
const EditFieldForm = ({ attribute, name, onClose })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { value, onChange } = strapiAdmin.useField(name);
    if (!value) {
        // This is very unlikely to happen, but it ensures the form is not opened without a value.
        console.error("You've opened a field to edit without it being part of the form, this is likely a bug with Strapi. Please open an issue.");
        toggleNotification({
            message: formatMessage({
                id: 'content-manager.containers.list-settings.modal-form.error',
                defaultMessage: 'An error occurred while trying to open the form.'
            }),
            type: 'danger'
        });
        return null;
    }
    let shouldDisplaySortToggle = ![
        'media',
        'relation'
    ].includes(attribute.type);
    if ('relation' in attribute && [
        'oneWay',
        'oneToOne',
        'manyToOne'
    ].includes(attribute.relation)) {
        shouldDisplaySortToggle = true;
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
                    children: /*#__PURE__*/ jsxRuntime.jsxs(HeaderContainer, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(FieldTypeIcon.FieldTypeIcon, {
                                type: attribute.type
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                                children: formatMessage({
                                    id: translations.getTranslation('containers.list-settings.modal-form.label'),
                                    defaultMessage: 'Edit {fieldName}'
                                }, {
                                    fieldName: strings.capitalise(value.label)
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
                                    id: translations.getTranslation('form.Input.label'),
                                    defaultMessage: 'Label'
                                }),
                                hint: formatMessage({
                                    id: translations.getTranslation('form.Input.label.inputDescription'),
                                    defaultMessage: "This value overrides the label displayed in the table's head"
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                label: formatMessage({
                                    id: translations.getTranslation('form.Input.sort.field'),
                                    defaultMessage: 'Enable sort on this field'
                                }),
                                name: 'sortable',
                                size: 6,
                                type: 'boolean'
                            }
                        ].filter((field)=>field.name !== 'sortable' || field.name === 'sortable' && shouldDisplaySortToggle).map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                s: 12,
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
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'app.components.Button.cancel',
                                defaultMessage: 'Cancel'
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
const HeaderContainer = styledComponents.styled(designSystem.Flex)`
  svg {
    width: 3.2rem;
    margin-right: ${({ theme })=>theme.spaces[3]};
  }
`;

exports.EditFieldForm = EditFieldForm;
//# sourceMappingURL=EditFieldForm.js.map
