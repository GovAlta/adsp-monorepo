import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, Typography, Grid } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import * as yup from 'yup';
import { Layouts } from '../../../../components/Layouts/Layout.mjs';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useTracking } from '../../../../features/Tracking.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { useRBAC } from '../../../../hooks/useRBAC.mjs';
import { useGetTransferTokenQuery, useCreateTransferTokenMutation, useUpdateTransferTokenMutation } from '../../../../services/transferTokens.mjs';
import { isBaseQueryError } from '../../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../utils/translatedErrors.mjs';
import { TRANSFER_TOKEN_TYPE } from '../../components/Tokens/constants.mjs';
import { FormHead } from '../../components/Tokens/FormHead.mjs';
import { LifeSpanInput } from '../../components/Tokens/LifeSpanInput.mjs';
import { TokenBox } from '../../components/Tokens/TokenBox.mjs';
import { TokenDescription } from '../../components/Tokens/TokenDescription.mjs';
import { TokenName } from '../../components/Tokens/TokenName.mjs';
import { TokenTypeSelect } from '../../components/Tokens/TokenTypeSelect.mjs';

const schema = yup.object().shape({
    name: yup.string().max(100).required(errorsTrads.required.id),
    description: yup.string().nullable(),
    lifespan: yup.number().integer().min(0).nullable().defined(errorsTrads.required.id),
    permissions: yup.string().required(errorsTrads.required.id)
});
/* -------------------------------------------------------------------------------------------------
 * EditView
 * -----------------------------------------------------------------------------------------------*/ const EditView = ()=>{
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const navigate = useNavigate();
    const { state: locationState } = useLocation();
    const [transferToken, setTransferToken] = React.useState(locationState && 'accessKey' in locationState.transferToken ? {
        ...locationState.transferToken
    } : null);
    const { trackUsage } = useTracking();
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens']);
    const { allowedActions: { canCreate, canUpdate, canRegenerate } } = useRBAC(permissions);
    const match = useMatch('/settings/transfer-tokens/:id');
    const id = match?.params?.id;
    const isCreating = id === 'create';
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    React.useEffect(()=>{
        trackUsage(isCreating ? 'didAddTokenFromList' : 'didEditTokenFromList', {
            tokenType: TRANSFER_TOKEN_TYPE
        });
    }, [
        isCreating,
        trackUsage
    ]);
    const { data, error } = useGetTransferTokenQuery(id, {
        skip: isCreating || transferToken !== null || !id
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
            setTransferToken(data);
        }
    }, [
        data
    ]);
    const [createToken] = useCreateTransferTokenMutation();
    const [updateToken] = useUpdateTransferTokenMutation();
    const handleSubmit = async (body, formik)=>{
        trackUsage(isCreating ? 'willCreateToken' : 'willEditToken', {
            tokenType: TRANSFER_TOKEN_TYPE
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
                        if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                        tokenType: TRANSFER_TOKEN_TYPE
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
                        if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
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
                        tokenType: TRANSFER_TOKEN_TYPE
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(Page.Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Transfer Tokens'
                })
            }),
            /*#__PURE__*/ jsx(Formik, {
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
                    return /*#__PURE__*/ jsxs(Form, {
                        children: [
                            /*#__PURE__*/ jsx(FormHead, {
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
                            /*#__PURE__*/ jsx(Layouts.Content, {
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    direction: "column",
                                    alignItems: "stretch",
                                    gap: 6,
                                    children: [
                                        transferToken && Boolean(transferToken?.name) && 'accessKey' in transferToken && /*#__PURE__*/ jsx(TokenBox, {
                                            token: transferToken.accessKey,
                                            tokenType: TRANSFER_TOKEN_TYPE
                                        }),
                                        /*#__PURE__*/ jsx(FormTransferTokenContainer, {
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
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['transfer-tokens'].read);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditView, {})
    });
};
const FormTransferTokenContainer = ({ errors = {}, onChange, canEditInputs, isCreating, values, transferToken = {} })=>{
    const { formatMessage } = useIntl();
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
    return /*#__PURE__*/ jsx(Box, {
        background: "neutral0",
        hasRadius: true,
        shadow: "filterShadow",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 4,
            children: [
                /*#__PURE__*/ jsx(Typography, {
                    variant: "delta",
                    tag: "h2",
                    children: formatMessage({
                        id: 'global.details',
                        defaultMessage: 'Details'
                    })
                }),
                /*#__PURE__*/ jsxs(Grid.Root, {
                    gap: 5,
                    children: [
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenName, {
                                error: errors['name'],
                                value: values['name'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "name"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenDescription, {
                                error: errors['description'],
                                value: values['description'],
                                canEditInputs: canEditInputs,
                                onChange: onChange
                            })
                        }, "description"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(LifeSpanInput, {
                                isCreating: isCreating,
                                error: errors['lifespan'],
                                value: values['lifespan'],
                                onChange: onChange,
                                token: transferToken
                            })
                        }, "lifespan"),
                        /*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            xs: 12,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(TokenTypeSelect, {
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

export { EditView, ProtectedEditView };
//# sourceMappingURL=EditView.mjs.map
