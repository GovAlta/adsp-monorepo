'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var RelativeTime = require('../../components/RelativeTime.js');
var DocumentStatus = require('../../pages/EditView/components/DocumentStatus.js');
var users = require('../../utils/users.js');
var History = require('../pages/History.js');

/* -------------------------------------------------------------------------------------------------
 * BlueText
 * -----------------------------------------------------------------------------------------------*/ const BlueText = (children)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
        textColor: "primary600",
        variant: "pi",
        children: children
    });
const VersionCard = ({ version, isCurrent })=>{
    const { formatDate, formatMessage } = reactIntl.useIntl();
    const [{ query }] = strapiAdmin.useQueryParams();
    const isActive = query.id === version.id.toString();
    const author = version.createdBy && users.getDisplayName(version.createdBy);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "flex-start",
        gap: 3,
        hasRadius: true,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isActive ? 'primary600' : 'neutral200',
        color: "neutral800",
        padding: 5,
        tag: reactRouterDom.Link,
        to: `?${qs.stringify({
            ...query,
            id: version.id
        })}`,
        style: {
            textDecoration: 'none'
        },
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                gap: 1,
                alignItems: "flex-start",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "h3",
                        fontWeight: "semiBold",
                        children: formatDate(version.createdAt, {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "p",
                        variant: "pi",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: 'content-manager.history.sidebar.versionDescription',
                            defaultMessage: '{distanceToNow}{isAnonymous, select, true {} other { by {author}}}{isCurrent, select, true { <b>(current)</b>} other {}}'
                        }, {
                            distanceToNow: /*#__PURE__*/ jsxRuntime.jsx(RelativeTime.RelativeTime, {
                                timestamp: new Date(version.createdAt)
                            }),
                            author,
                            isAnonymous: !Boolean(version.createdBy),
                            isCurrent,
                            b: BlueText
                        })
                    })
                ]
            }),
            version.status && /*#__PURE__*/ jsxRuntime.jsx(DocumentStatus.DocumentStatus, {
                status: version.status,
                size: "XS"
            })
        ]
    });
};
const PaginationButton = ({ page, children })=>{
    const [{ query }] = strapiAdmin.useQueryParams();
    // Remove the id from the pagination link, so that the history page can redirect
    // to the id of the first history version in the new page once it's loaded
    const { id: _id, ...queryRest } = query;
    return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Link, {
        to: {
            search: qs.stringify({
                ...queryRest,
                page
            })
        },
        style: {
            textDecoration: 'none'
        },
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
            variant: "omega",
            textColor: "primary600",
            children: children
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * VersionsList
 * -----------------------------------------------------------------------------------------------*/ const VersionsList = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { versions, page } = History.useHistoryContext('VersionsList', (state)=>({
            versions: state.versions,
            page: state.page
        }));
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        shrink: 0,
        direction: "column",
        alignItems: "stretch",
        width: "320px",
        height: "100dvh",
        background: "neutral0",
        borderColor: "neutral200",
        borderWidth: "0 0 0 1px",
        borderStyle: "solid",
        tag: "aside",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "row",
                justifyContent: "space-between",
                padding: 4,
                borderColor: "neutral200",
                borderWidth: "0 0 1px",
                borderStyle: "solid",
                tag: "header",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "h2",
                        variant: "omega",
                        fontWeight: "semiBold",
                        children: formatMessage({
                            id: 'content-manager.history.sidebar.title',
                            defaultMessage: 'Versions'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        background: "neutral150",
                        hasRadius: true,
                        padding: 1,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "sigma",
                            textColor: "neutral600",
                            children: versions.meta.pagination.total
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                flex: 1,
                overflow: "auto",
                children: [
                    versions.meta.pagination.page > 1 && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        textAlign: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(PaginationButton, {
                            page: page - 1,
                            children: formatMessage({
                                id: 'content-manager.history.sidebar.show-newer',
                                defaultMessage: 'Show newer versions'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        direction: "column",
                        gap: 3,
                        padding: 4,
                        tag: "ul",
                        alignItems: "stretch",
                        children: versions.data.map((version, index)=>/*#__PURE__*/ jsxRuntime.jsx("li", {
                                "aria-label": formatMessage({
                                    id: 'content-manager.history.sidebar.title.version-card.aria-label',
                                    defaultMessage: 'Version card'
                                }),
                                children: /*#__PURE__*/ jsxRuntime.jsx(VersionCard, {
                                    version: version,
                                    isCurrent: page === 1 && index === 0
                                })
                            }, version.id))
                    }),
                    versions.meta.pagination.page < versions.meta.pagination.pageCount && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingBottom: 4,
                        textAlign: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(PaginationButton, {
                            page: page + 1,
                            children: formatMessage({
                                id: 'content-manager.history.sidebar.show-older',
                                defaultMessage: 'Show older versions'
                            })
                        })
                    })
                ]
            })
        ]
    });
};

exports.VersionsList = VersionsList;
//# sourceMappingURL=VersionsList.js.map
