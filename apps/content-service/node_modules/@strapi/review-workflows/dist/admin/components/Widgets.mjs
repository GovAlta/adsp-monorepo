import { jsx, jsxs } from 'react/jsx-runtime';
import { Widget, useTracking } from '@strapi/admin/strapi-admin';
import { DocumentStatus, RelativeTime } from '@strapi/content-manager/strapi-admin';
import { Typography, Table, Tbody, Tr, Td, Box, IconButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { StageColumn } from '../routes/content-manager/model/components/TableColumns.mjs';
import { useGetRecentlyAssignedDocumentsQuery } from '../services/content-manager.mjs';

const CellTypography = styled(Typography)`
  display: block;
  max-width: 14.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const RecentDocumentsTable = ({ documents, type })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const navigate = useNavigate();
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
    return /*#__PURE__*/ jsx(Table, {
        colCount: 6,
        rowCount: documents?.length ?? 0,
        children: /*#__PURE__*/ jsx(Tbody, {
            children: documents?.map((document)=>/*#__PURE__*/ jsxs(Tr, {
                    onClick: handleRowClick(document),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(CellTypography, {
                                title: document.title,
                                variant: "omega",
                                textColor: "neutral800",
                                children: document.title
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(CellTypography, {
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
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Box, {
                                display: "inline-block",
                                children: document.status ? /*#__PURE__*/ jsx(DocumentStatus, {
                                    status: document.status
                                }) : /*#__PURE__*/ jsx(Typography, {
                                    textColor: "neutral600",
                                    "aria-hidden": true,
                                    children: "-"
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                textColor: "neutral600",
                                children: /*#__PURE__*/ jsx(RelativeTime, {
                                    timestamp: new Date(document.updatedAt)
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(StageColumn, {
                                strapi_stage: document.strapi_stage
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsx(Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    tag: Link,
                                    to: getEditViewLink(document),
                                    onClick: ()=>trackUsage('willEditEntryFromHome', {
                                            entryType: type
                                        }),
                                    label: formatMessage({
                                        id: 'content-manager.actions.edit.label',
                                        defaultMessage: 'Edit'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Pencil, {})
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
    const { formatMessage } = useIntl();
    const { data, isLoading, error } = useGetRecentlyAssignedDocumentsQuery();
    if (isLoading) {
        return /*#__PURE__*/ jsx(Widget.Loading, {});
    }
    if (error || !data) {
        return /*#__PURE__*/ jsx(Widget.Error, {});
    }
    if (data.length === 0) {
        return /*#__PURE__*/ jsx(Widget.NoData, {
            children: formatMessage({
                id: 'review-workflows.widget.assigned.no-data',
                defaultMessage: 'No entries'
            })
        });
    }
    return /*#__PURE__*/ jsx(RecentDocumentsTable, {
        documents: data,
        type: "assigned"
    });
};

export { AssignedWidget };
//# sourceMappingURL=Widgets.mjs.map
