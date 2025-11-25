import { jsx, jsxs } from 'react/jsx-runtime';
import { useNotification, useField, Form, InputRenderer } from '@strapi/admin/strapi-admin';
import { Flex, Modal, Grid, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import * as yup from 'yup';
import { FieldTypeIcon } from '../../../components/FieldTypeIcon.mjs';
import { capitalise } from '../../../utils/strings.mjs';
import { getTranslation } from '../../../utils/translations.mjs';

const FIELD_SCHEMA = yup.object().shape({
    label: yup.string().required(),
    sortable: yup.boolean()
});
const EditFieldForm = ({ attribute, name, onClose })=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { value, onChange } = useField(name);
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
                    children: /*#__PURE__*/ jsxs(HeaderContainer, {
                        children: [
                            /*#__PURE__*/ jsx(FieldTypeIcon, {
                                type: attribute.type
                            }),
                            /*#__PURE__*/ jsx(Modal.Title, {
                                children: formatMessage({
                                    id: getTranslation('containers.list-settings.modal-form.label'),
                                    defaultMessage: 'Edit {fieldName}'
                                }, {
                                    fieldName: capitalise(value.label)
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
                                    id: getTranslation('form.Input.label'),
                                    defaultMessage: 'Label'
                                }),
                                hint: formatMessage({
                                    id: getTranslation('form.Input.label.inputDescription'),
                                    defaultMessage: "This value overrides the label displayed in the table's head"
                                }),
                                size: 6,
                                type: 'string'
                            },
                            {
                                label: formatMessage({
                                    id: getTranslation('form.Input.sort.field'),
                                    defaultMessage: 'Enable sort on this field'
                                }),
                                name: 'sortable',
                                size: 6,
                                type: 'boolean'
                            }
                        ].filter((field)=>field.name !== 'sortable' || field.name === 'sortable' && shouldDisplaySortToggle).map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                s: 12,
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
                        /*#__PURE__*/ jsx(Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'app.components.Button.cancel',
                                defaultMessage: 'Cancel'
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
const HeaderContainer = styled(Flex)`
  svg {
    width: 3.2rem;
    margin-right: ${({ theme })=>theme.spaces[3]};
  }
`;

export { EditFieldForm };
//# sourceMappingURL=EditFieldForm.mjs.map
