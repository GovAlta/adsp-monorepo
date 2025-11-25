'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Notifications = require('../../../../../../../../admin/src/features/Notifications.js');
var useAPIErrorHandler = require('../../../../../../../../admin/src/hooks/useAPIErrorHandler.js');
var auditLogs = require('../../../../../services/auditLogs.js');
var useFormatTimeStamp = require('../hooks/useFormatTimeStamp.js');
var getActionTypesDefaultMessages = require('../utils/getActionTypesDefaultMessages.js');

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

const Modal = ({ handleClose, logId })=>{
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const { data, error, isLoading } = auditLogs.useGetAuditLogQuery(logId);
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
            handleClose();
        }
    }, [
        error,
        formatAPIError,
        handleClose,
        toggleNotification
    ]);
    const formatTimeStamp = useFormatTimeStamp.useFormatTimeStamp();
    const formattedDate = data && 'date' in data ? formatTimeStamp(data.date) : '';
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        defaultOpen: true,
        onOpenChange: handleClose,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Breadcrumbs, {
                        label: formattedDate,
                        id: "title",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                            isCurrent: true,
                            children: formattedDate
                        })
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(ActionBody, {
                        isLoading: isLoading,
                        data: data,
                        formattedDate: formattedDate
                    })
                })
            ]
        })
    });
};
const ActionBody = ({ isLoading, data, formattedDate })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            padding: 7,
            justifyContent: "center",
            alignItems: "center",
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                children: "Loading content..."
            })
        });
    }
    const { action, user, payload } = data;
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginBottom: 3,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "delta",
                    id: "title",
                    children: formatMessage({
                        id: 'Settings.permissions.auditLogs.details',
                        defaultMessage: 'Log Details'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                gap: 4,
                gridCols: 2,
                paddingTop: 4,
                paddingBottom: 4,
                paddingLeft: 6,
                paddingRight: 6,
                marginBottom: 4,
                background: "neutral100",
                hasRadius: true,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.action',
                            defaultMessage: 'Action'
                        }),
                        actionName: formatMessage({
                            id: `Settings.permissions.auditLogs.${action}`,
                            defaultMessage: getActionTypesDefaultMessages.getDefaultMessage(action)
                        }, // @ts-expect-error - any
                        {
                            model: payload?.model
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.date',
                            defaultMessage: 'Date'
                        }),
                        actionName: formattedDate
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.user',
                            defaultMessage: 'User'
                        }),
                        actionName: user?.displayName || '-'
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.userId',
                            defaultMessage: 'User ID'
                        }),
                        actionName: user?.id.toString() || '-'
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                        children: formatMessage({
                            id: 'Settings.permissions.auditLogs.payload',
                            defaultMessage: 'Payload'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(Payload, {
                        value: JSON.stringify(payload, null, 2),
                        disabled: true
                    })
                ]
            })
        ]
    });
};
const Payload = styled.styled(designSystem.JSONInput)`
  max-width: 100%;
  overflow: scroll;
`;
const ActionItem = ({ actionLabel, actionName })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "baseline",
        gap: 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                variant: "sigma",
                children: actionLabel
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                textColor: "neutral600",
                children: actionName
            })
        ]
    });
};

exports.Modal = Modal;
//# sourceMappingURL=Modal.js.map
