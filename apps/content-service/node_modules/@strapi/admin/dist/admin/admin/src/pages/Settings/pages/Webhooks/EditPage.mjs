import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useMatch, useNavigate } from 'react-router-dom';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { useNotification } from '../../../../features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler.mjs';
import { selectAdminPermissions } from '../../../../selectors.mjs';
import { isBaseQueryError } from '../../../../utils/baseQuery.mjs';
import { WebhookForm } from './components/WebhookForm.mjs';
import { useWebhooks } from './hooks/useWebhooks.mjs';

/* -------------------------------------------------------------------------------------------------
 * EditView
 * -----------------------------------------------------------------------------------------------*/ const cleanData = (data)=>({
        ...data,
        headers: data.headers.reduce((acc, { key, value })=>{
            if (key !== '') {
                acc[key] = value;
            }
            return acc;
        }, {})
    });
const EditPage = ()=>{
    const { formatMessage } = useIntl();
    const match = useMatch('/settings/webhooks/:id');
    const id = match?.params.id;
    const isCreating = id === 'create';
    const navigate = useNavigate();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    /**
   * Prevents the notifications from showing up twice because the function identity
   * coming from the helper plugin is not stable
   */ // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableFormatAPIError = React.useCallback(formatAPIError, []);
    const [isTriggering, setIsTriggering] = React.useState(false);
    const [triggerResponse, setTriggerResponse] = React.useState();
    const { isLoading, webhooks, error, createWebhook, updateWebhook, triggerWebhook } = useWebhooks({
        id: id
    }, {
        skip: isCreating
    });
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: stableFormatAPIError(error)
            });
        }
    }, [
        error,
        toggleNotification,
        stableFormatAPIError
    ]);
    const handleTriggerWebhook = async ()=>{
        try {
            setIsTriggering(true);
            const res = await triggerWebhook(id);
            if ('error' in res) {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
                return;
            }
            setTriggerResponse(res.data);
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        } finally{
            setIsTriggering(false);
        }
    };
    const handleSubmit = async (data, helpers)=>{
        try {
            if (isCreating) {
                const res = await createWebhook(cleanData(data));
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
                        id: 'Settings.webhooks.created'
                    })
                });
                navigate(`../webhooks/${res.data.id}`, {
                    replace: true
                });
            } else {
                const res = await updateWebhook({
                    id: id,
                    ...cleanData(data)
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
                        id: 'notification.form.success.fields'
                    })
                });
            }
        } catch  {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred'
                })
            });
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    const [webhook] = webhooks ?? [];
    return /*#__PURE__*/ jsxs(Main, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Webhooks'
                })
            }),
            /*#__PURE__*/ jsx(WebhookForm, {
                data: webhook,
                handleSubmit: handleSubmit,
                triggerWebhook: handleTriggerWebhook,
                isCreating: isCreating,
                isTriggering: isTriggering,
                triggerResponse: triggerResponse
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedEditView
 * -----------------------------------------------------------------------------------------------*/ const ProtectedEditPage = ()=>{
    const permissions = useTypedSelector(selectAdminPermissions);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions.settings?.webhooks.update,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });
};

export { EditPage, ProtectedEditPage };
//# sourceMappingURL=EditPage.mjs.map
