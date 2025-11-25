'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var locales = require('../services/locales.js');
var baseQuery = require('../utils/baseQuery.js');
var getTranslation = require('../utils/getTranslation.js');
var CreateLocale = require('./CreateLocale.js');

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

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const EditLocale = (props)=>{
    const { formatMessage } = reactIntl.useIntl();
    const [visible, setVisible] = React__namespace.useState(false);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                onClick: ()=>setVisible(true),
                label: formatMessage({
                    id: getTranslation.getTranslation('Settings.list.actions.edit'),
                    defaultMessage: 'Edit {name} locale'
                }, {
                    name: props.name
                }),
                variant: "ghost",
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsx(EditModal, {
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
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = strapiAdmin.useAPIErrorHandler();
    const refetchPermissions = strapiAdmin.useAuth('EditModal', (state)=>state.refetchPermissions);
    const { formatMessage } = reactIntl.useIntl();
    const titleId = designSystem.useId();
    const [updateLocale] = locales.useUpdateLocaleMutation();
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
                if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                    id: getTranslation.getTranslation('Settings.locales.modal.edit.success'),
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: open,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
            children: /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Form, {
                method: "PUT",
                onSubmit: handleSubmit,
                initialValues: {
                    code,
                    name,
                    isDefault
                },
                validationSchema: CreateLocale.LOCALE_SCHEMA,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                            children: formatMessage({
                                id: getTranslation.getTranslation('Settings.list.actions.edit'),
                                defaultMessage: 'Edit a locale'
                            }, {
                                name
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
                            variant: "simple",
                            defaultValue: "basic",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    justifyContent: "space-between",
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            tag: "h2",
                                            variant: "beta",
                                            id: titleId,
                                            children: formatMessage({
                                                id: getTranslation.getTranslation('Settings.locales.modal.title'),
                                                defaultMessage: 'Configuration'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.List, {
                                            "aria-labelledby": titleId,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                                    value: "basic",
                                                    children: formatMessage({
                                                        id: getTranslation.getTranslation('Settings.locales.modal.base'),
                                                        defaultMessage: 'Basic settings'
                                                    })
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                                                    value: "advanced",
                                                    children: formatMessage({
                                                        id: getTranslation.getTranslation('Settings.locales.modal.advanced'),
                                                        defaultMessage: 'Advanced settings'
                                                    })
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {}),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                    paddingTop: 7,
                                    paddingBottom: 7,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                                            value: "basic",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(CreateLocale.BaseForm, {
                                                mode: "edit"
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                                            value: "advanced",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(CreateLocale.AdvancedForm, {
                                                isDefaultLocale: isDefault
                                            })
                                        })
                                    ]
                                })
                            ]
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
                            /*#__PURE__*/ jsxRuntime.jsx(CreateLocale.SubmitButton, {})
                        ]
                    })
                ]
            })
        })
    });
};

exports.EditLocale = EditLocale;
exports.EditModal = EditModal;
//# sourceMappingURL=EditLocale.js.map
