import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Layouts } from '../../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../../features/Notifications.mjs';
import { useTracking } from '../../../../../features/Tracking.mjs';
import { useAPIErrorHandler } from '../../../../../hooks/useAPIErrorHandler.mjs';
import { useRBAC } from '../../../../../hooks/useRBAC.mjs';
import { useGetAPITokenQuery, useCreateAPITokenMutation, useUpdateAPITokenMutation } from '../../../../../services/apiTokens.mjs';
import { useGetPermissionsQuery, useGetRoutesQuery } from '../../../../../services/contentApi.mjs';
import { isBaseQueryError } from '../../../../../utils/baseQuery.mjs';
import { API_TOKEN_TYPE } from '../../../components/Tokens/constants.mjs';
import { FormHead } from '../../../components/Tokens/FormHead.mjs';
import { ApiTokenBox } from '../../../components/Tokens/TokenBox.mjs';
import { ApiTokenPermissionsProvider } from './apiTokenPermissions.mjs';
import { FormApiTokenContainer } from './components/FormApiTokenContainer.mjs';
import { Permissions } from './components/Permissions.mjs';
import { schema } from './constants.mjs';
import { reducer, initialState } from './reducer.mjs';

/**
 * TODO: this could definitely be refactored to avoid using redux and instead just use the
 * server response as the source of the truth for the data.
 */ const EditView = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { state: locationState } = useLocation();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions);
    const [apiToken, setApiToken] = React.useState(locationState?.apiToken?.accessKey ? {
        ...locationState.apiToken
    } : null);
    const [showToken, setShowToken] = React.useState(Boolean(locationState?.apiToken?.accessKey));
    const hideTimerRef = React.useRef(null);
    const { trackUsage } = useTracking();
    const { allowedActions: { canCreate, canUpdate, canRegenerate } } = useRBAC(permissions.settings?.['api-tokens']);
    const [state, dispatch] = React.useReducer(reducer, initialState);
    const match = useMatch('/settings/api-tokens/:id');
    const id = match?.params?.id;
    const isCreating = id === 'create';
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidtionErrors } = useAPIErrorHandler();
    const navigate = useNavigate();
    const contentAPIPermissionsQuery = useGetPermissionsQuery();
    const contentAPIRoutesQuery = useGetRoutesQuery();
    /**
   * Separate effects otherwise we could end
   * up duplicating the same notification.
   */ React.useEffect(()=>{
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
    React.useEffect(()=>{
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
    React.useEffect(()=>{
        if (contentAPIPermissionsQuery.data) {
            dispatch({
                type: 'UPDATE_PERMISSIONS_LAYOUT',
                value: contentAPIPermissionsQuery.data
            });
        }
    }, [
        contentAPIPermissionsQuery.data
    ]);
    React.useEffect(()=>{
        if (contentAPIRoutesQuery.data) {
            dispatch({
                type: 'UPDATE_ROUTES',
                value: contentAPIRoutesQuery.data
            });
        }
    }, [
        contentAPIRoutesQuery.data
    ]);
    React.useEffect(()=>{
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
    React.useEffect(()=>{
        trackUsage(isCreating ? 'didAddTokenFromList' : 'didEditTokenFromList', {
            tokenType: API_TOKEN_TYPE
        });
    }, [
        isCreating,
        trackUsage
    ]);
    const { data, error, isLoading } = useGetAPITokenQuery(id, {
        skip: !id || isCreating || !!apiToken
    });
    React.useEffect(()=>{
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
    React.useEffect(()=>{
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
    React.useEffect(()=>{
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
    const [createToken] = useCreateAPITokenMutation();
    const [updateToken] = useUpdateAPITokenMutation();
    const handleSubmit = async (body, formik)=>{
        trackUsage(isCreating ? 'willCreateToken' : 'willEditToken', {
            tokenType: API_TOKEN_TYPE
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
                    if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                    tokenType: API_TOKEN_TYPE
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
                    if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                    tokenType: API_TOKEN_TYPE
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
    const [hasChangedPermissions, setHasChangedPermissions] = React.useState(false);
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsx(ApiTokenPermissionsProvider, {
        value: providerValue,
        children: /*#__PURE__*/ jsxs(Page.Main, {
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: 'Settings.PageTitle',
                        defaultMessage: 'Settings - {name}'
                    }, {
                        name: 'API Tokens'
                    })
                }),
                /*#__PURE__*/ jsx(Formik, {
                    validationSchema: schema,
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
                        return /*#__PURE__*/ jsxs(Form, {
                            children: [
                                /*#__PURE__*/ jsx(FormHead, {
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
                                /*#__PURE__*/ jsx(Layouts.Content, {
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            apiToken?.accessKey && showToken && /*#__PURE__*/ jsx(Fragment, {
                                                children: /*#__PURE__*/ jsx(ApiTokenBox, {
                                                    token: apiToken.accessKey,
                                                    tokenType: API_TOKEN_TYPE
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(FormApiTokenContainer, {
                                                errors: errors,
                                                onChange: handleChange,
                                                canEditInputs: canEditInputs,
                                                isCreating: isCreating,
                                                values: values,
                                                apiToken: apiToken,
                                                onDispatch: dispatch,
                                                setHasChangedPermissions: setHasChangedPermissions
                                            }),
                                            /*#__PURE__*/ jsx(Permissions, {
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
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['api-tokens'].read);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditView, {})
    });
};

export { EditView, ProtectedEditView };
//# sourceMappingURL=EditViewPage.mjs.map
