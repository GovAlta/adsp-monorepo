'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var TableColumns = require('../routes/content-manager/model/components/TableColumns.js');
var contentManager = require('../services/content-manager.js');

const CellTypography = styledComponents.styled(designSystem.Typography)`
  display: block;
  max-width: 14.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const RecentDocumentsTable = ({ documents, type })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const navigate = reactRouterDom.useNavigate();
    const getEditViewLink = (document)=>{
        const isSingleType = document.kind === 'singleType';
        const kindPath = isSingleType ? 'single-types' : 'collection-types';
        const queryParams = document.locale ? `?plugins[i18n][locale]=${document.locale}` : '';
        return `/content-manager/${kindPath}/${document.contentTypeUid}${isSingleType ? '' : '/' + document.documentId}${queryParams}`;
    };
    const handleRowClick = (document)=>()=>{
            trackUsage('willEditEntryFromHome', {
                entryType: type
            });
            const link = getEditViewLink(document);
            navigate(link);
        };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Table, {
        colCount: 6,
        rowCount: documents?.length ?? 0,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
            children: documents?.map((document)=>/*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    onClick: handleRowClick(document),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(CellTypography, {
                                title: document.title,
                                variant: "omega",
                                textColor: "neutral800",
                                children: document.title
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(CellTypography, {
                                variant: "omega",
                                textColor: "neutral600",
                                children: document.kind === 'singleType' ? formatMessage({
                                    id: 'content-manager.widget.last-edited.single-type',
                                    defaultMessage: 'Single-Type'
                                }) : formatMessage({
                                    id: document.contentTypeDisplayName,
                                    defaultMessage: document.contentTypeDisplayName
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                display: "inline-block",
                                children: document.status ? /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin$1.DocumentStatus, {
                                    status: document.status
                                }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    textColor: "neutral600",
                                    "aria-hidden": true,
                                    children: "-"
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral600",
                                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin$1.RelativeTime, {
                                    timestamp: new Date(document.updatedAt)
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(TableColumns.StageColumn, {
                                strapi_stage: document.strapi_stage
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    tag: reactRouterDom.Link,
                                    to: getEditViewLink(document),
                                    onClick: ()=>trackUsage('willEditEntryFromHome', {
                                            entryType: type
                                        }),
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
                }, document.documentId))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * AssignedWidget
 * -----------------------------------------------------------------------------------------------*/ const AssignedWidget = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { data, isLoading, error } = contentManager.useGetRecentlyAssignedDocumentsQuery();
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Loading, {});
    }
    if (error || !data) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.Error, {});
    }
    if (data.length === 0) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Widget.NoData, {
            children: formatMessage({
                id: 'review-workflows.widget.assigned.no-data',
                defaultMessage: 'No entries'
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(RecentDocumentsTable, {
        documents: data,
        type: "assigned"
    });
};

exports.AssignedWidget = AssignedWidget;
//# sourceMappingURL=Widgets.js.map
