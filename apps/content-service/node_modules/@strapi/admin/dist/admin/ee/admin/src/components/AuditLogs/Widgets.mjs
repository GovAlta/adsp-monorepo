import { jsx, jsxs } from 'react/jsx-runtime';
import { Widget, useTracking } from '@strapi/admin/strapi-admin';
import { Table, Tbody, Tr, Td, Typography, Box, IconButton } from '@strapi/design-system';
import { Eye } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { RelativeTime as RelativeTime$1 } from '../../../../../admin/src/components/RelativeTime.mjs';
import { useQueryParams } from '../../../../../admin/src/hooks/useQueryParams.mjs';
import { AUDIT_LOGS_DEFAULT_PAGE_SIZE } from '../../constants.mjs';
import { getDefaultMessage } from '../../pages/SettingsPage/pages/AuditLogs/utils/getActionTypesDefaultMessages.mjs';
import { useGetAuditLogsQuery } from '../../services/auditLogs.mjs';

const RelativeTime = styled(RelativeTime$1)`
  display: inline-block;

  &::first-letter {
    text-transform: uppercase;
  }
`;
const LastActivityTable = ({ items })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const navigate = useNavigate();
    const getAuditLogDetailsLink = (item)=>{
        return `/settings/audit-logs?pageSize=${AUDIT_LOGS_DEFAULT_PAGE_SIZE}&page=1&sort=date:DESC&id=${item.id}`;
    };
    const handleRowClick = (document)=>()=>{
            trackUsage('willOpenAuditLogDetailsFromHome');
            const link = getAuditLogDetailsLink(document);
            navigate(link);
        };
    return /*#__PURE__*/ jsx(Table, {
        colCount: 4,
        rowCount: items?.length ?? 0,
        children: /*#__PURE__*/ jsx(Tbody, {
            children: items?.map((item)=>{
                const action = formatMessage({
                    id: `Settings.permissions.auditLogs.${item.action}`,
                    // @ts-expect-error – getDefaultMessage probably doesn't benefit from being so strongly typed unless we just add string at the end.
                    defaultMessage: getDefaultMessage(item.action)
                }, {
                    model: item.payload.model ?? ''
                });
                const userDisplayName = item.user?.displayName ?? '-';
                return /*#__PURE__*/ jsxs(Tr, {
                    onClick: handleRowClick(item),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                title: action,
                                variant: "omega",
                                textColor: "neutral800",
                                children: action
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "omega",
                                textColor: "neutral800",
                                children: /*#__PURE__*/ jsx(RelativeTime, {
                                    timestamp: new Date(item.date)
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                title: userDisplayName,
                                variant: "omega",
                                textColor: "neutral800",
                                children: userDisplayName
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsx(Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    tag: Link,
                                    to: getAuditLogDetailsLink(item),
                                    onClick: ()=>trackUsage('willOpenAuditLogDetailsFromHome'),
                                    label: formatMessage({
                                        id: 'global.details',
                                        defaultMessage: 'Details'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Eye, {})
                                })
                            })
                        })
                    ]
                }, `lastActivity_auditLog_${item.id}`);
            })
        })
    });
};
const AuditLogsWidget = ()=>{
    const { formatMessage } = useIntl();
    const [{ query }] = useQueryParams();
    const { data, isLoading, error } = useGetAuditLogsQuery({
        ...query,
        page: 1,
        pageSize: 4,
        sort: 'date:DESC'
    }, {
        refetchOnMountOrArgChange: true
    });
    if (isLoading) {
        return /*#__PURE__*/ jsx(Widget.Loading, {});
    }
    if (error || !data?.results) {
        return /*#__PURE__*/ jsx(Widget.Error, {});
    }
    if (data.results.length === 0) {
        return /*#__PURE__*/ jsx(Widget.NoData, {
            children: formatMessage({
                id: 'widget.last-activity.no-activity',
                defaultMessage: 'No activity'
            })
        });
    }
    return /*#__PURE__*/ jsx(LastActivityTable, {
        items: data.results ?? []
    });
};

export { AuditLogsWidget };
//# sourceMappingURL=Widgets.mjs.map
