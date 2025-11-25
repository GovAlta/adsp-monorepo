'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var RelativeTime$1 = require('../../../../../admin/src/components/RelativeTime.js');
var useQueryParams = require('../../../../../admin/src/hooks/useQueryParams.js');
var constants = require('../../constants.js');
var getActionTypesDefaultMessages = require('../../pages/SettingsPage/pages/AuditLogs/utils/getActionTypesDefaultMessages.js');
var auditLogs = require('../../services/auditLogs.js');

const RelativeTime = styled.styled(RelativeTime$1.RelativeTime)`
  display: inline-block;

  &::first-letter {
    text-transform: uppercase;
  }
`;
const LastActivityTable = ({ items })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const navigate = reactRouterDom.useNavigate();
    const getAuditLogDetailsLink = (item)=>{
        return `/settings/audit-logs?pageSize=${constants.AUDIT_LOGS_DEFAULT_PAGE_SIZE}&page=1&sort=date:DESC&id=${item.id}`;
    };
    const handleRowClick = (document)=>()=>{
            trackUsage('willOpenAuditLogDetailsFromHome');
            const link = getAuditLogDetailsLink(document);
            navigate(link);
        };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Table, {
        colCount: 4,
        rowCount: items?.length ?? 0,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
            children: items?.map((item)=>{
                const action = formatMessage({
                    id: `Settings.permissions.auditLogs.${item.action}`,
                    // @ts-expect-error – getDefaultMessage probably doesn't benefit from being so strongly typed unless we just add string at the end.
                    defaultMessage: getActionTypesDefaultMessages.getDefaultMessage(item.action)
                }, {
                    model: item.payload.model ?? ''
                });
                const userDisplayName = item.user?.displayName ?? '-';
                return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    onClick: handleRowClick(item),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                title: action,
                                variant: "omega",
                                textColor: "neutral800",
                                children: action
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                textColor: "neutral800",
                                children: /*#__PURE__*/ jsxRuntime.jsx(RelativeTime, {
                                    timestamp: new Date(item.date)
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                title: userDisplayName,
                                variant: "omega",
                                textColor: "neutral800",
                                children: userDisplayName
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    tag: reactRouterDom.Link,
                                    to: getAuditLogDetailsLink(item),
                                    onClick: ()=>trackUsage('willOpenAuditLogDetailsFromHome'),
                                    label: formatMessage({
                                        id: 'global.details',
                                        defaultMessage: 'Details'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Eye, {})
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
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }] = useQueryParams.useQueryParams();
    const { data, isLoading, error } = auditLogs.useGetAuditLogsQuery({
        ...query,
        page: 1,
        pageSize: 4,
        sort: 'date:DESC'
    }, {
        refetchOnMountOrArgChange: true
    });
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Loading, {});
    }
    if (error || !data?.results) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Error, {});
    }
    if (data.results.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.NoData, {
            children: formatMessage({
                id: 'widget.last-activity.no-activity',
                defaultMessage: 'No activity'
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(LastActivityTable, {
        items: data.results ?? []
    });
};

exports.AuditLogsWidget = AuditLogsWidget;
//# sourceMappingURL=Widgets.js.map
