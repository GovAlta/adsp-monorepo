'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var yup = require('yup');
var Layout = require('../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var Notifications = require('../../../../features/Notifications.js');
var Tracking = require('../../../../features/Tracking.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var useRBAC = require('../../../../hooks/useRBAC.js');
var transferTokens = require('../../../../services/transferTokens.js');
var baseQuery = require('../../../../utils/baseQuery.js');
var translatedErrors = require('../../../../utils/translatedErrors.js');
var constants = require('../../components/Tokens/constants.js');
var FormHead = require('../../components/Tokens/FormHead.js');
var LifeSpanInput = require('../../components/Tokens/LifeSpanInput.js');
var TokenBox = require('../../components/Tokens/TokenBox.js');
var TokenDescription = require('../../components/Tokens/TokenDescription.js');
var TokenName = require('../../components/Tokens/TokenName.js');
var TokenTypeSelect = require('../../components/Tokens/TokenTypeSelect.js');

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
var yup__namespace = /*#__PURE__*/_interopNamespaceDefault(yup);

const schema = yup__namespace.object().shape({
    name: yup__namespace.string().max(100).required(translatedErrors.translatedErrors.required.id),
    description: yup__namespace.string().nullable(),
    lifespan: yup__namespace.number().integer().min(0).nullable().defined(translatedErrors.translatedErrors.required.id),
    permissions: yup__namespace.string().required(translatedErrors.translatedErrors.required.id)
});
/* -------------------------------------------------------------------------------------------------
 * EditView
 * -----------------------------------------------------------------------------------------------*/ const EditView = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const navigate = reactRouterDom.useNavigate();
    const { state: locationState } = reactRouterDom.useLocation();
    const [transferToken, setTransferToken] = React__namespace.useState(locationState && 'accessKey' in locationState.transferToken ? {
        ...locationState.transferToken
    } : null);
    const { trackUsage } = Tracking.useTracking();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens']);
    const { allowedActions: { canCreate, canUpdate, canRegenerate } } = useRBAC.useRBAC(permissions);
    const match = reactRouterDom.useMatch('/settings/transfer-tokens/:id');
    const id = match?.params?.id;
    const isCreating = id === 'create';
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    React__namespace.useEffect(()=>{
        trackUsage(isCreating ? 'didAddTokenFromList' : 'didEditTokenFromList', {
            tokenType: constants.TRANSFER_TOKEN_TYPE
        });
    }, [
        isCreating,
        trackUsage
    ]);
    const { data, error } = transferTokens.useGetTransferTokenQuery(id, {
        skip: isCreating || transferToken !== null || !id
    });
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    React__namespace.useEffect(()=>{
        if (data) {
            setTransferToken(data);
        }
    }, [
        data
    ]);
    const [createToken] = transferTokens.useCreateTransferTokenMutation();
    const [updateToken] = transferTokens.useUpdateTransferTokenMutation();
    const handleSubmit = async (body, formik)=>{
        trackUsage(isCreating ? 'willCreateToken' : 'willEditToken', {
            tokenType: constants.TRANSFER_TOKEN_TYPE
        });
        const permissions = body.permissions.split('-');
        const isPermissionsTransferPermission = (permission)=>{
            if (permission.length === 1) {
                return permission[0] === 'push' || permission[0] === 'pull';
            }
            return permission[0] === 'push' && permission[1] === 'pull';
        };
        // this type-guard is necessary to satisfy the type for `permissions` in the request body,
        // because String.split returns stringp[]
        if (isPermissionsTransferPermission(permissions)) {
            try {
                if (isCreating) {
                    const res = await createToken({
                        ...body,
                        // lifespan must be "null" for unlimited (0 would mean instantly expired and isn't accepted)
                        lifespan: body?.lifespan && body.lifespan !== '0' ? parseInt(body.lifespan.toString(), 10) : null,
                        permissions
                    });
                    if ('error' in res) {
                        if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                            formik.setErrors(formatValidationErrors(res.error));
                        } else {
                            toggleNotification({
                                type: 'danger',
                                message: formatAPIError(res.error)
                            });
                        }
                        return;
                    }
                    setTransferToken(res.data);
                    toggleNotification({
                        type: 'success',
                        message: formatMessage({
                            id: 'notification.success.transfertokencreated',
                            defaultMessage: 'Transfer Token successfully created'
                        })
                    });
                    trackUsage('didCreateToken', {
                        type: transferToken?.permissions,
                        tokenType: constants.TRANSFER_TOKEN_TYPE
                    });
                    navigate(`../transfer-tokens/${res.data.id.toString()}`, {
                        replace: true,
                        state: {
                            transferToken: res.data
                        }
                    });
                } else {
                    const res = await updateToken({
                        id: id,
                        name: body.name,
                        description: body.description,
                        permissions
                    });
                    if ('error' in res) {
                        if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                            formik.setErrors(formatValidationErrors(res.error));
                        } else {
                            toggleNotification({
                                type: 'danger',
                                message: formatAPIError(res.error)
                            });
                        }
                        return;
                    }
                    setTransferToken(res.data);
                    toggleNotification({
                        type: 'success',
                        message: formatMessage({
                            id: 'notification.success.transfertokenedited',
                            defaultMessage: 'Transfer Token successfully edited'
                        })
                    });
                    trackUsage('didEditToken', {
                        type: transferToken?.permissions,
                        tokenType: constants.TRANSFER_TOKEN_TYPE
                    });
                }
            } catch (err) {
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'Something went wrong'
                    })
                });
            }
        }
    };
    const canEditInputs = canUpdate && !isCreating || canCreate && isCreating;
    const isLoading = !isCreating && !transferToken;
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Transfer Tokens'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                validationSchema: schema,
                validateOnChange: false,
                initialValues: {
                    name: transferToken?.name || '',
                    description: transferToken?.description || '',
                    lifespan: transferToken?.lifespan || null,
                    /**
             * We need to cast the permissions to satisfy the type for `permissions`
             * in the request body incase we don't have a transferToken and instead
             * use an empty string.
             */ permissions: transferToken?.permissions.join('-') ?? ''
                },
                enableReinitialize: true,
                onSubmit: (body, actions)=>handleSubmit(body, actions),
                children: ({ errors, handleChange, isSubmitting, values })=>{
                    return /*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(FormHead.FormHead, {
                                title: {
                                    id: 'Settings.transferTokens.createPage.title',
                                    defaultMessage: 'TokenCreate Transfer Token'
                                },
                                token: transferToken,
                                setToken: setTransferToken,
                                canShowToken: false,
                                canEditInputs: canEditInputs,
                                canRegenerate: canRegenerate,
                                isSubmitting: isSubmitting,
                                regenerateUrl: "/admin/transfer/tokens/"
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 6,
                                    children: [
                                        transferToken && Boolean(transferToken?.name) && 'accessKey' in transferToken && /*#__PURE__*/ jsxRuntime.jsx(TokenBox.TokenBox, {
                                            token: transferToken.accessKey,
                                            tokenType: constants.TRANSFER_TOKEN_TYPE
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(FormTransferTokenContainer, {
                                            errors: errors,
                                            onChange: handleChange,
                                            canEditInputs: canEditInputs,
                                            isCreating: isCreating,
                                            values: values,
                                            transferToken: transferToken
                                        })
                                    ]
                                })
                            })
                        ]
                    });
                }
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedEditView
 * -----------------------------------------------------------------------------------------------*/ const ProtectedEditView = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens'].read);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditView, {})
    });
};
const FormTransferTokenContainer = ({ errors = {}, onChange, canEditInputs, isCreating, values, transferToken = {} })=>{
    const { formatMessage } = reactIntl.useIntl();
    const typeOptions = [
        {
            value: 'push',
            label: {
                id: 'Settings.transferTokens.types.push',
                defaultMessage: 'Push'
            }
        },
        {
            value: 'pull',
            label: {
                id: 'Settings.transferTokens.types.pull',
                defaultMessage: 'Pull'
            }
        },
        {
            value: 'push-pull',
            label: {
                id: 'Settings.transferTokens.types.push-pull',
                defaultMessage: 'Full Access'
            }
        }
    ];
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "delta",
                    tag: "h2",
                    children: formatMessage({
                        id: 'global.details',
                        defaultMessage: 'Details'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                    gap: 5,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenName.TokenName, {
                                error: errors['name'],
                                value: values['name'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "name"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenDescription.TokenDescription, {
                                error: errors['description'],
                                value: values['description'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "description"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(LifeSpanInput.LifeSpanInput, {
                                isCreating: isCreating,
                                error: errors['lifespan'],
                                value: values['lifespan'],
                                onChange: onChange,
                                token: transferToken
                            })
                        }, "lifespan"),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(TokenTypeSelect.TokenTypeSelect, {
                                name: "permissions",
                                value: values['permissions'],
                                error: errors['permissions'],
                                label: {
                                    id: 'Settings.tokens.form.type',
                                    defaultMessage: 'Token type'
                                },
                                // @ts-expect-error – DS Select passes number | string, will be fixed in V2
                                onChange: (value)=>{
                                    onChange({
                                        target: {
                                            name: 'permissions',
                                            value
                                        }
                                    });
                                },
                                options: typeOptions,
                                canEditInputs: canEditInputs
                            })
                        }, "permissions")
                    ]
                })
            ]
        })
    });
};

exports.EditView = EditView;
exports.ProtectedEditView = ProtectedEditView;
//# sourceMappingURL=EditView.js.map
