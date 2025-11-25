'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var PageHelpers = require('../../../../components/PageHelpers.js');
var hooks = require('../../../../core/store/hooks.js');
var Notifications = require('../../../../features/Notifications.js');
var useAPIErrorHandler = require('../../../../hooks/useAPIErrorHandler.js');
var selectors = require('../../../../selectors.js');
var baseQuery = require('../../../../utils/baseQuery.js');
var WebhookForm = require('./components/WebhookForm.js');
var useWebhooks = require('./hooks/useWebhooks.js');

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
    const { formatMessage } = reactIntl.useIntl();
    const match = reactRouterDom.useMatch('/settings/webhooks/:id');
    const id = match?.params.id;
    const isCreating = id === 'create';
    const navigate = reactRouterDom.useNavigate();
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler.useAPIErrorHandler();
    /**
   * Prevents the notifications from showing up twice because the function identity
   * coming from the helper plugin is not stable
   */ // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableFormatAPIError = React__namespace.useCallback(formatAPIError, []);
    const [isTriggering, setIsTriggering] = React__namespace.useState(false);
    const [triggerResponse, setTriggerResponse] = React__namespace.useState();
    const { isLoading, webhooks, error, createWebhook, updateWebhook, triggerWebhook } = useWebhooks.useWebhooks({
        id: id
    }, {
        skip: isCreating
    });
    React__namespace.useEffect(()=>{
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
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    const [webhook] = webhooks ?? [];
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'Settings.PageTitle',
                    defaultMessage: 'Settings - {name}'
                }, {
                    name: 'Webhooks'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(WebhookForm.WebhookForm, {
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
    const permissions = hooks.useTypedSelector(selectors.selectAdminPermissions);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Protect, {
        permissions: permissions.settings?.webhooks.update,
        children: /*#__PURE__*/ jsxRuntime.jsx(EditPage, {})
    });
};

exports.EditPage = EditPage;
exports.ProtectedEditPage = ProtectedEditPage;
//# sourceMappingURL=EditPage.js.map
