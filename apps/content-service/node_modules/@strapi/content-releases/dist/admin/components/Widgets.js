'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var ReleasesPage = require('../pages/ReleasesPage.js');
var homepage = require('../services/homepage.js');
var RelativeTime = require('./RelativeTime.js');

const CellTypography = styledComponents.styled(designSystem.Typography)`
  display: block;
  max-width: 14.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ReleasesTable = ({ items })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const navigate = reactRouterDom.useNavigate();
    const getEditViewLink = (item)=>{
        return `/plugins/content-releases/${item.id}`;
    };
    const handleRowClick = (item)=>()=>{
            trackUsage('willEditReleaseFromHome');
            const link = getEditViewLink(item);
            navigate(link);
        };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Table, {
        colCount: 4,
        rowCount: items?.length ?? 0,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
            children: items?.map((item)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    onClick: handleRowClick(item),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(CellTypography, {
                                title: item.name,
                                variant: "omega",
                                textColor: "neutral800",
                                children: item.name
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                display: "inline-block",
                                children: item.status ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
                                    ...ReleasesPage.getBadgeProps(item.status),
                                    children: item.status
                                }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    textColor: "neutral600",
                                    "aria-hidden": true,
                                    children: "-"
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                textTransform: "capitalize",
                                textColor: "neutral600",
                                children: item.scheduledAt ? /*#__PURE__*/ jsxRuntime.jsx(RelativeTime.RelativeTime, {
                                    timestamp: new Date(item.scheduledAt)
                                }) : formatMessage({
                                    id: 'content-releases.pages.Releases.not-scheduled',
                                    defaultMessage: 'Not scheduled'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    tag: reactRouterDom.Link,
                                    to: getEditViewLink(item),
                                    onClick: ()=>trackUsage('willEditReleaseFromHome'),
                                    label: formatMessage({
                                        id: 'content-manager.actions.edit.label',
                                        defaultMessage: 'Edit'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                })
                            })
                        })
                    ]
                }, item.documentId))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Upcoming Releases
 * -----------------------------------------------------------------------------------------------*/ const UpcomingReleasesWidget = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { data, isLoading, error } = homepage.useGetUpcomingReleasesQuery();
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Loading, {});
    }
    if (error || !data) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Error, {});
    }
    if (data.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.NoData, {
            children: formatMessage({
                id: 'content-releases.widget.upcoming-releases.no-data',
                defaultMessage: 'No releases'
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(ReleasesTable, {
        items: data
    });
};

exports.UpcomingReleasesWidget = UpcomingReleasesWidget;
//# sourceMappingURL=Widgets.js.map
