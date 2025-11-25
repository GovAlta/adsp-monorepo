import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { JSONInput, Modal as Modal$1, Breadcrumbs, Crumb, Flex, Loader, Box, Typography, Grid, Field } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useNotification } from '../../../../../../../../admin/src/features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../../../../../admin/src/hooks/useAPIErrorHandler.mjs';
import { useGetAuditLogQuery } from '../../../../../services/auditLogs.mjs';
import { useFormatTimeStamp } from '../hooks/useFormatTimeStamp.mjs';
import { getDefaultMessage } from '../utils/getActionTypesDefaultMessages.mjs';

const Modal = ({ handleClose, logId })=>{
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { data, error, isLoading } = useGetAuditLogQuery(logId);
    React.useEffect(()=>{
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
    const formatTimeStamp = useFormatTimeStamp();
    const formattedDate = data && 'date' in data ? formatTimeStamp(data.date) : '';
    return /*#__PURE__*/ jsx(Modal$1.Root, {
        defaultOpen: true,
        onOpenChange: handleClose,
        children: /*#__PURE__*/ jsxs(Modal$1.Content, {
            children: [
                /*#__PURE__*/ jsx(Modal$1.Header, {
                    children: /*#__PURE__*/ jsx(Breadcrumbs, {
                        label: formattedDate,
                        id: "title",
                        children: /*#__PURE__*/ jsx(Crumb, {
                            isCurrent: true,
                            children: formattedDate
                        })
                    })
                }),
                /*#__PURE__*/ jsx(Modal$1.Body, {
                    children: /*#__PURE__*/ jsx(ActionBody, {
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
    const { formatMessage } = useIntl();
    if (isLoading) {
        return /*#__PURE__*/ jsx(Flex, {
            padding: 7,
            justifyContent: "center",
            alignItems: "center",
            children: /*#__PURE__*/ jsx(Loader, {
                children: "Loading content..."
            })
        });
    }
    const { action, user, payload } = data;
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Box, {
                marginBottom: 3,
                children: /*#__PURE__*/ jsx(Typography, {
                    variant: "delta",
                    id: "title",
                    children: formatMessage({
                        id: 'Settings.permissions.auditLogs.details',
                        defaultMessage: 'Log Details'
                    })
                })
            }),
            /*#__PURE__*/ jsxs(Grid.Root, {
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
                    /*#__PURE__*/ jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.action',
                            defaultMessage: 'Action'
                        }),
                        actionName: formatMessage({
                            id: `Settings.permissions.auditLogs.${action}`,
                            defaultMessage: getDefaultMessage(action)
                        }, // @ts-expect-error - any
                        {
                            model: payload?.model
                        })
                    }),
                    /*#__PURE__*/ jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.date',
                            defaultMessage: 'Date'
                        }),
                        actionName: formattedDate
                    }),
                    /*#__PURE__*/ jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.user',
                            defaultMessage: 'User'
                        }),
                        actionName: user?.displayName || '-'
                    }),
                    /*#__PURE__*/ jsx(ActionItem, {
                        actionLabel: formatMessage({
                            id: 'Settings.permissions.auditLogs.userId',
                            defaultMessage: 'User ID'
                        }),
                        actionName: user?.id.toString() || '-'
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Field.Root, {
                children: [
                    /*#__PURE__*/ jsx(Field.Label, {
                        children: formatMessage({
                            id: 'Settings.permissions.auditLogs.payload',
                            defaultMessage: 'Payload'
                        })
                    }),
                    /*#__PURE__*/ jsx(Payload, {
                        value: JSON.stringify(payload, null, 2),
                        disabled: true
                    })
                ]
            })
        ]
    });
};
const Payload = styled(JSONInput)`
  max-width: 100%;
  overflow: scroll;
`;
const ActionItem = ({ actionLabel, actionName })=>{
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "baseline",
        gap: 1,
        children: [
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                variant: "sigma",
                children: actionLabel
            }),
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                children: actionName
            })
        ]
    });
};

export { Modal };
//# sourceMappingURL=Modal.mjs.map
