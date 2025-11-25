import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useAPIErrorHandler, useAuth, Form } from '@strapi/admin/strapi-admin';
import { IconButton, useId, Modal, Tabs, Flex, Typography, Divider, Box, Button } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useUpdateLocaleMutation } from '../services/locales.mjs';
import { isBaseQueryError } from '../utils/baseQuery.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';
import { LOCALE_SCHEMA, BaseForm, AdvancedForm, SubmitButton } from './CreateLocale.mjs';

const EditLocale = (props)=>{
    const { formatMessage } = useIntl();
    const [visible, setVisible] = React.useState(false);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(IconButton, {
                onClick: ()=>setVisible(true),
                label: formatMessage({
                    id: getTranslation('Settings.list.actions.edit'),
                    defaultMessage: 'Edit {name} locale'
                }, {
                    name: props.name
                }),
                variant: "ghost",
                children: /*#__PURE__*/ jsx(Pencil, {})
            }),
            /*#__PURE__*/ jsx(EditModal, {
                ...props,
                open: visible,
                onOpenChange: setVisible
            })
        ]
    });
};
/**
 * @internal
 * @description Exported to be used when someone clicks on a table row.
 */ const EditModal = ({ id, code, isDefault, name, open, onOpenChange })=>{
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const refetchPermissions = useAuth('EditModal', (state)=>state.refetchPermissions);
    const { formatMessage } = useIntl();
    const titleId = useId();
    const [updateLocale] = useUpdateLocaleMutation();
    const handleSubmit = async ({ code: _code, ...data }, helpers)=>{
        try {
            /**
       * We don't need to send the code, because the
       * code can never be changed.
       */ const res = await updateLocale({
                id,
                ...data
            });
            if ('error' in res) {
                if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                    helpers.setErrors(formatValidationErrors(res.error));
                } else {
                    toggleNotification({
                        type: 'danger',
                        message: formatAPIError(res.error)
                    });
                }
                return;
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: getTranslation('Settings.locales.modal.edit.success'),
                    defaultMessage: 'Locale successfully edited'
                })
            });
            refetchPermissions();
            onOpenChange(false);
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred, please try again'
                })
            });
        }
    };
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ jsx(Modal.Content, {
            children: /*#__PURE__*/ jsxs(Form, {
                method: "PUT",
                onSubmit: handleSubmit,
                initialValues: {
                    code,
                    name,
                    isDefault
                },
                validationSchema: LOCALE_SCHEMA,
                children: [
                    /*#__PURE__*/ jsx(Modal.Header, {
                        children: /*#__PURE__*/ jsx(Modal.Title, {
                            children: formatMessage({
                                id: getTranslation('Settings.list.actions.edit'),
                                defaultMessage: 'Edit a locale'
                            }, {
                                name
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Modal.Body, {
                        children: /*#__PURE__*/ jsxs(Tabs.Root, {
                            variant: "simple",
                            defaultValue: "basic",
                            children: [
                                /*#__PURE__*/ jsxs(Flex, {
                                    justifyContent: "space-between",
                                    children: [
                                        /*#__PURE__*/ jsx(Typography, {
                                            tag: "h2",
                                            variant: "beta",
                                            id: titleId,
                                            children: formatMessage({
                                                id: getTranslation('Settings.locales.modal.title'),
                                                defaultMessage: 'Configuration'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxs(Tabs.List, {
                                            "aria-labelledby": titleId,
                                            children: [
                                                /*#__PURE__*/ jsx(Tabs.Trigger, {
                                                    value: "basic",
                                                    children: formatMessage({
                                                        id: getTranslation('Settings.locales.modal.base'),
                                                        defaultMessage: 'Basic settings'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsx(Tabs.Trigger, {
                                                    value: "advanced",
                                                    children: formatMessage({
                                                        id: getTranslation('Settings.locales.modal.advanced'),
                                                        defaultMessage: 'Advanced settings'
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Divider, {}),
                                /*#__PURE__*/ jsxs(Box, {
                                    paddingTop: 7,
                                    paddingBottom: 7,
                                    children: [
                                        /*#__PURE__*/ jsx(Tabs.Content, {
                                            value: "basic",
                                            children: /*#__PURE__*/ jsx(BaseForm, {
                                                mode: "edit"
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Tabs.Content, {
                                            value: "advanced",
                                            children: /*#__PURE__*/ jsx(AdvancedForm, {
                                                isDefaultLocale: isDefault
                                            })
                                        })
                                    ]
                                })
                            ]
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
                            /*#__PURE__*/ jsx(SubmitButton, {})
                        ]
                    })
                ]
            })
        })
    });
};

export { EditLocale, EditModal };
//# sourceMappingURL=EditLocale.mjs.map
