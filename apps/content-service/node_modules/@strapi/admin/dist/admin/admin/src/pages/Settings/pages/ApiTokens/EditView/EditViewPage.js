'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Layout = require('../../../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../../../components/PageHelpers.js');
var hooks = require('../../../../../core/store/hooks.js');
var Notifications = require('../../../../../features/Notifications.js');
var Tracking = require('../../../../../features/Tracking.js');
var useAPIErrorHandler = require('../../../../../hooks/useAPIErrorHandler.js');
var useRBAC = require('../../../../../hooks/useRBAC.js');
var apiTokens = require('../../../../../services/apiTokens.js');
var contentApi = require('../../../../../services/contentApi.js');
var baseQuery = require('../../../../../utils/baseQuery.js');
var constants = require('../../../components/Tokens/constants.js');
var FormHead = require('../../../components/Tokens/FormHead.js');
var TokenBox = require('../../../components/Tokens/TokenBox.js');
var apiTokenPermissions = require('./apiTokenPermissions.js');
var FormApiTokenContainer = require('./components/FormApiTokenContainer.js');
var Permissions = require('./components/Permissions.js');
var constants$1 = require('./constants.js');
var reducer = require('./reducer.js');

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

/**
 * TODO: this could definitely be refactored to avoid using redux and instead just use the
 * server response as the source of the truth for the data.
 */ const EditView = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const { state: locationState } = reactRouterDom.useLocation();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    const [apiToken, setApiToken] = React__namespace.useState(locationState?.apiToken?.accessKey ? {
        ...locationState.apiToken
    } : null);
    const [showToken, setShowToken] = React__namespace.useState(Boolean(locationState?.apiToken?.accessKey));
    const hideTimerRef = React__namespace.useRef(null);
    const { trackUsage } = Tracking.useTracking();
    const { allowedActions: { canCreate, canUpdate, canRegenerate } } = useRBAC.useRBAC(permissions.settings?.['api-tokens']);
    const [state, dispatch] = React__namespace.useReducer(reducer.reducer, reducer.initialState);
    const match = reactRouterDom.useMatch('/settings/api-tokens/:id');
    const id = match?.params?.id;
    const isCreating = id === 'create';
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidtionErrors } = useAPIErrorHandler.useAPIErrorHandler();
    const navigate = reactRouterDom.useNavigate();
    const contentAPIPermissionsQuery = contentApi.useGetPermissionsQuery();
    const contentAPIRoutesQuery = contentApi.useGetRoutesQuery();
    /**
   * Separate effects otherwise we could end
   * up duplicating the same notification.
   */ React__namespace.useEffect(()=>{
        if (contentAPIPermissionsQuery.error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(contentAPIPermissionsQuery.error)
            });
        }
    }, [
        contentAPIPermissionsQuery.error,
        formatAPIError,
        toggleNotification
    ]);
    React__namespace.useEffect(()=>{
        if (contentAPIRoutesQuery.error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(contentAPIRoutesQuery.error)
            });
        }
    }, [
        contentAPIRoutesQuery.error,
        formatAPIError,
        toggleNotification
    ]);
    React__namespace.useEffect(()=>{
        if (contentAPIPermissionsQuery.data) {
            dispatch({
                type: 'UPDATE_PERMISSIONS_LAYOUT',
                value: contentAPIPermissionsQuery.data
            });
        }
    }, [
        contentAPIPermissionsQuery.data
    ]);
    React__namespace.useEffect(()=>{
        if (contentAPIRoutesQuery.data) {
            dispatch({
                type: 'UPDATE_ROUTES',
                value: contentAPIRoutesQuery.data
            });
        }
    }, [
        contentAPIRoutesQuery.data
    ]);
    React__namespace.useEffect(()=>{
        if (apiToken) {
            if (apiToken.type === 'read-only') {
                dispatch({
                    type: 'ON_CHANGE_READ_ONLY'
                });
            }
            if (apiToken.type === 'full-access') {
                dispatch({
                    type: 'SELECT_ALL_ACTIONS'
                });
            }
            if (apiToken.type === 'custom') {
                dispatch({
                    type: 'UPDATE_PERMISSIONS',
                    value: apiToken?.permissions
                });
            }
        }
    }, [
        apiToken
    ]);
    React__namespace.useEffect(()=>{
        trackUsage(isCreating ? 'didAddTokenFromList' : 'didEditTokenFromList', {
            tokenType: constants.API_TOKEN_TYPE
        });
    }, [
        isCreating,
        trackUsage
    ]);
    const { data, error, isLoading } = apiTokens.useGetAPITokenQuery(id, {
        skip: !id || isCreating || !!apiToken
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
            setApiToken(data);
            if (data.type === 'read-only') {
                dispatch({
                    type: 'ON_CHANGE_READ_ONLY'
                });
            }
            if (data.type === 'full-access') {
                dispatch({
                    type: 'SELECT_ALL_ACTIONS'
                });
            }
            if (data.type === 'custom') {
                dispatch({
                    type: 'UPDATE_PERMISSIONS',
                    value: data?.permissions
                });
            }
        }
    }, [
        data
    ]);
    React__namespace.useEffect(()=>{
        // Only set up timer when token is shown
        if (showToken) {
            hideTimerRef.current = setTimeout(()=>{
                setShowToken(false);
            }, 30000); // 30 seconds
            // Cleanup on unmount or when showToken changes
            return ()=>{
                if (hideTimerRef.current) {
                    clearTimeout(hideTimerRef.current);
                    hideTimerRef.current = null;
                }
            };
        }
    }, [
        showToken
    ]);
    const [createToken] = apiTokens.useCreateAPITokenMutation();
    const [updateToken] = apiTokens.useUpdateAPITokenMutation();
    const handleSubmit = async (body, formik)=>{
        trackUsage(isCreating ? 'willCreateToken' : 'willEditToken', {
            tokenType: constants.API_TOKEN_TYPE
        });
        try {
            if (isCreating) {
                const res = await createToken({
                    ...body,
                    // lifespan must be "null" for unlimited (0 would mean instantly expired and isn't accepted)
                    lifespan: body?.lifespan && body.lifespan !== '0' ? parseInt(body.lifespan.toString(), 10) : null,
                    permissions: body.type === 'custom' ? state.selectedActions : null
                });
                if ('error' in res) {
                    if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                        formik.setErrors(formatValidtionErrors(res.error));
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
                        id: 'notification.success.apitokencreated',
                        defaultMessage: 'API Token successfully created'
                    })
                });
                trackUsage('didCreateToken', {
                    type: res.data.type,
                    tokenType: constants.API_TOKEN_TYPE
                });
                navigate(`../api-tokens/${res.data.id.toString()}`, {
                    state: {
                        apiToken: res.data
                    },
                    replace: true
                });
            } else {
                const res = await updateToken({
                    id: id,
                    name: body.name,
                    description: body.description,
                    type: body.type,
                    permissions: body.type === 'custom' ? state.selectedActions : null
                });
                if ('error' in res) {
                    if (baseQuery.isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                        formik.setErrors(formatValidtionErrors(res.error));
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
                        id: 'notification.success.apitokenedited',
                        defaultMessage: 'API Token successfully edited'
                    })
                });
                trackUsage('didEditToken', {
                    type: res.data.type,
                    tokenType: constants.API_TOKEN_TYPE
                });
            }
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'Something went wrong'
                })
            });
        }
    };
    const [hasChangedPermissions, setHasChangedPermissions] = React__namespace.useState(false);
    const handleChangeCheckbox = ({ target: { value } })=>{
        setHasChangedPermissions(true);
        dispatch({
            type: 'ON_CHANGE',
            value
        });
    };
    const handleChangeSelectAllCheckbox = ({ target: { value } })=>{
        setHasChangedPermissions(true);
        dispatch({
            type: 'SELECT_ALL_IN_PERMISSION',
            value
        });
    };
    const setSelectedAction = ({ target: { value } })=>{
        dispatch({
            type: 'SET_SELECTED_ACTION',
            value
        });
    };
    const toggleToken = ()=>{
        setShowToken((prev)=>!prev);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    };
    const providerValue = {
        ...state,
        onChange: handleChangeCheckbox,
        onChangeSelectAll: handleChangeSelectAllCheckbox,
        setSelectedAction
    };
    const canEditInputs = canUpdate && !isCreating || canCreate && isCreating;
    const canShowToken = !!apiToken?.accessKey;
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsx(apiTokenPermissions.ApiTokenPermissionsProvider, {
        value: providerValue,
        children: /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                    children: formatMessage({
                        id: 'Settings.PageTitle',
                        defaultMessage: 'Settings - {name}'
                    }, {
                        name: 'API Tokens'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                    validationSchema: constants$1.schema,
                    validateOnChange: false,
                    initialValues: {
                        name: apiToken?.name || '',
                        description: apiToken?.description || '',
                        type: apiToken?.type,
                        lifespan: apiToken?.lifespan
                    },
                    enableReinitialize: true,
                    onSubmit: (body, actions)=>handleSubmit(body, actions),
                    children: ({ errors, handleChange, isSubmitting, values, setFieldValue })=>{
                        if (hasChangedPermissions && values?.type !== 'custom') {
                            setFieldValue('type', 'custom');
                        }
                        return /*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(FormHead.FormHead, {
                                    title: {
                                        id: 'Settings.apiTokens.createPage.title',
                                        defaultMessage: 'Create API Token'
                                    },
                                    token: apiToken,
                                    setToken: setApiToken,
                                    toggleToken: toggleToken,
                                    showToken: showToken,
                                    canEditInputs: canEditInputs,
                                    canRegenerate: canRegenerate,
                                    canShowToken: canShowToken,
                                    isSubmitting: isSubmitting,
                                    regenerateUrl: "/admin/api-tokens/"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            apiToken?.accessKey && showToken && /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(TokenBox.ApiTokenBox, {
                                                    token: apiToken.accessKey,
                                                    tokenType: constants.API_TOKEN_TYPE
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(FormApiTokenContainer.FormApiTokenContainer, {
                                                errors: errors,
                                                onChange: handleChange,
                                                canEditInputs: canEditInputs,
                                                isCreating: isCreating,
                                                values: values,
                                                apiToken: apiToken,
                                                onDispatch: dispatch,
                                                setHasChangedPermissions: setHasChangedPermissions
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(Permissions.Permissions, {
                                                disabled: !canEditInputs || values?.type === 'read-only' || values?.type === 'full-access'
                                            })
                                        ]
                                    })
                                })
                            ]
                        });
                    }
                })
            ]
        })
    });
};
const ProtectedEditView = ()=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['api-tokens'].read);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditView, {})
    });
};

exports.EditView = EditView;
exports.ProtectedEditView = ProtectedEditView;
//# sourceMappingURL=EditViewPage.js.map
