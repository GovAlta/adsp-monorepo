import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { useQueryParams } from '@strapi/admin/strapi-admin';
import { Flex, Typography, Box } from '@strapi/design-system';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { RelativeTime } from '../../components/RelativeTime.mjs';
import { DocumentStatus } from '../../pages/EditView/components/DocumentStatus.mjs';
import { getDisplayName } from '../../utils/users.mjs';
import { useHistoryContext } from '../pages/History.mjs';

/* -------------------------------------------------------------------------------------------------
 * BlueText
 * -----------------------------------------------------------------------------------------------*/ const BlueText = (children)=>/*#__PURE__*/ jsx(Typography, {
        textColor: "primary600",
        variant: "pi",
        children: children
    });
const VersionCard = ({ version, isCurrent })=>{
    const { formatDate, formatMessage } = useIntl();
    const [{ query }] = useQueryParams();
    const isActive = query.id === version.id.toString();
    const author = version.createdBy && getDisplayName(version.createdBy);
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "flex-start",
        gap: 3,
        hasRadius: true,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isActive ? 'primary600' : 'neutral200',
        color: "neutral800",
        padding: 5,
        tag: Link,
        to: `?${stringify({
            ...query,
            id: version.id
        })}`,
        style: {
            textDecoration: 'none'
        },
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                gap: 1,
                alignItems: "flex-start",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
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
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "p",
                        variant: "pi",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: 'content-manager.history.sidebar.versionDescription',
                            defaultMessage: '{distanceToNow}{isAnonymous, select, true {} other { by {author}}}{isCurrent, select, true { <b>(current)</b>} other {}}'
                        }, {
                            distanceToNow: /*#__PURE__*/ jsx(RelativeTime, {
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
            version.status && /*#__PURE__*/ jsx(DocumentStatus, {
                status: version.status,
                size: "XS"
            })
        ]
    });
};
const PaginationButton = ({ page, children })=>{
    const [{ query }] = useQueryParams();
    // Remove the id from the pagination link, so that the history page can redirect
    // to the id of the first history version in the new page once it's loaded
    const { id: _id, ...queryRest } = query;
    return /*#__PURE__*/ jsx(Link, {
        to: {
            search: stringify({
                ...queryRest,
                page
            })
        },
        style: {
            textDecoration: 'none'
        },
        children: /*#__PURE__*/ jsx(Typography, {
            variant: "omega",
            textColor: "primary600",
            children: children
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * VersionsList
 * -----------------------------------------------------------------------------------------------*/ const VersionsList = ()=>{
    const { formatMessage } = useIntl();
    const { versions, page } = useHistoryContext('VersionsList', (state)=>({
            versions: state.versions,
            page: state.page
        }));
    return /*#__PURE__*/ jsxs(Flex, {
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
            /*#__PURE__*/ jsxs(Flex, {
                direction: "row",
                justifyContent: "space-between",
                padding: 4,
                borderColor: "neutral200",
                borderWidth: "0 0 1px",
                borderStyle: "solid",
                tag: "header",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "h2",
                        variant: "omega",
                        fontWeight: "semiBold",
                        children: formatMessage({
                            id: 'content-manager.history.sidebar.title',
                            defaultMessage: 'Versions'
                        })
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        background: "neutral150",
                        hasRadius: true,
                        padding: 1,
                        children: /*#__PURE__*/ jsx(Typography, {
                            variant: "sigma",
                            textColor: "neutral600",
                            children: versions.meta.pagination.total
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Box, {
                flex: 1,
                overflow: "auto",
                children: [
                    versions.meta.pagination.page > 1 && /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        textAlign: "center",
                        children: /*#__PURE__*/ jsx(PaginationButton, {
                            page: page - 1,
                            children: formatMessage({
                                id: 'content-manager.history.sidebar.show-newer',
                                defaultMessage: 'Show newer versions'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Flex, {
                        direction: "column",
                        gap: 3,
                        padding: 4,
                        tag: "ul",
                        alignItems: "stretch",
                        children: versions.data.map((version, index)=>/*#__PURE__*/ jsx("li", {
                                "aria-label": formatMessage({
                                    id: 'content-manager.history.sidebar.title.version-card.aria-label',
                                    defaultMessage: 'Version card'
                                }),
                                children: /*#__PURE__*/ jsx(VersionCard, {
                                    version: version,
                                    isCurrent: page === 1 && index === 0
                                })
                            }, version.id))
                    }),
                    versions.meta.pagination.page < versions.meta.pagination.pageCount && /*#__PURE__*/ jsx(Box, {
                        paddingBottom: 4,
                        textAlign: "center",
                        children: /*#__PURE__*/ jsx(PaginationButton, {
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

export { VersionsList };
//# sourceMappingURL=VersionsList.mjs.map
