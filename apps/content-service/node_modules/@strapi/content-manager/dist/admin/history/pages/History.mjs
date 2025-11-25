import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext, useRBAC, Page, useQueryParams } from '@strapi/admin/strapi-admin';
import { Portal, FocusTrap, Box, Link, Flex, Main } from '@strapi/design-system';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { useParams, Navigate, NavLink } from 'react-router-dom';
import { COLLECTION_TYPES } from '../../constants/collections.mjs';
import { PERMISSIONS } from '../../constants/plugin.mjs';
import { DocumentRBAC } from '../../features/DocumentRBAC.mjs';
import { useDocument } from '../../hooks/useDocument.mjs';
import { useDocumentLayout } from '../../hooks/useDocumentLayout.mjs';
import { useGetContentTypeConfigurationQuery } from '../../services/contentTypes.mjs';
import { buildValidParams } from '../../utils/api.mjs';
import { VersionContent } from '../components/VersionContent.mjs';
import { VersionHeader } from '../components/VersionHeader.mjs';
import { VersionsList } from '../components/VersionsList.mjs';
import { useGetHistoryVersionsQuery } from '../services/historyVersion.mjs';

const [HistoryProvider, useHistoryContext] = createContext('HistoryPage');
/* -------------------------------------------------------------------------------------------------
 * HistoryPage
 * -----------------------------------------------------------------------------------------------*/ const HistoryPage = ()=>{
    const headerId = React.useId();
    const { formatMessage } = useIntl();
    const { slug, id: documentId, collectionType } = useParams();
    const { isLoading: isLoadingDocument, schema } = useDocument({
        collectionType: collectionType,
        model: slug
    });
    const { isLoading: isLoadingLayout, edit: { layout, settings: { displayName, mainField } } } = useDocumentLayout(slug);
    const { data: configuration, isLoading: isLoadingConfiguration } = useGetContentTypeConfigurationQuery(slug);
    // Parse state from query params
    const [{ query }] = useQueryParams();
    const { id: selectedVersionId, ...queryWithoutId } = query;
    const validQueryParamsWithoutId = buildValidParams(queryWithoutId);
    const page = validQueryParamsWithoutId.page ? Number(validQueryParamsWithoutId.page) : 1;
    const versionsResponse = useGetHistoryVersionsQuery({
        contentType: slug,
        ...documentId ? {
            documentId
        } : {},
        // Omit id since it's not needed by the endpoint and caused extra refetches
        ...validQueryParamsWithoutId
    }, {
        refetchOnMountOrArgChange: true
    });
    /**
   * When the page is first mounted, if there's already data in the cache, RTK has a fullfilled
   * status for the first render, right before it triggers a new request. This means the code
   * briefly reaches the part that redirects to the first history version (if none is set).
   * But since that data is stale, that means auto-selecting a version that may not be the most
   * recent. To avoid this, we identify through requestId if the query is stale despite the
   * fullfilled status, and show the loader in that case.
   * This means we essentially don't want cache. We always refetch when the page mounts, and
   * we always show the loader until we have the most recent data. That's fine for this page.
   */ const initialRequestId = React.useRef(versionsResponse.requestId);
    const isStaleRequest = versionsResponse.requestId === initialRequestId.current;
    /**
   * Ensure that we have the necessary data to render the page:
   * - slug for single types
   * - slug _and_ documentId for collection types
   */ if (!slug || collectionType === COLLECTION_TYPES && !documentId) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/content-manager"
        });
    }
    if (isLoadingDocument || isLoadingLayout || versionsResponse.isFetching || isStaleRequest || isLoadingConfiguration) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    // It was a success, handle empty data
    if (!versionsResponse.isError && !versionsResponse.data?.data?.length) {
        return /*#__PURE__*/ jsx(Fragment, {
            children: /*#__PURE__*/ jsx(Page.NoData, {
                action: /*#__PURE__*/ jsx(Link, {
                    tag: NavLink,
                    to: `/content-manager/${collectionType}/${slug}${documentId ? `/${documentId}` : ''}`,
                    children: formatMessage({
                        id: 'global.back',
                        defaultMessage: 'Back'
                    })
                })
            })
        });
    }
    // We have data, handle selected version
    if (versionsResponse.data?.data?.length && !selectedVersionId) {
        return /*#__PURE__*/ jsx(Navigate, {
            to: {
                search: stringify({
                    ...query,
                    id: versionsResponse.data.data[0].id
                })
            },
            replace: true
        });
    }
    const selectedVersion = versionsResponse.data?.data?.find((version)=>version.id.toString() === selectedVersionId);
    if (versionsResponse.isError || !layout || !schema || !selectedVersion || !configuration || // This should not happen as it's covered by versionsResponse.isError, but we need it for TS
    versionsResponse.data.error) {
        return /*#__PURE__*/ jsx(Page.Error, {});
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'content-manager.history.page-title',
                    defaultMessage: '{contentType} history'
                }, {
                    contentType: displayName
                })
            }),
            /*#__PURE__*/ jsx(HistoryProvider, {
                contentType: slug,
                id: documentId,
                schema: schema,
                layout: layout,
                configuration: configuration,
                selectedVersion: selectedVersion,
                versions: versionsResponse.data,
                page: page,
                mainField: mainField,
                children: /*#__PURE__*/ jsxs(Flex, {
                    direction: "row",
                    alignItems: "flex-start",
                    children: [
                        /*#__PURE__*/ jsxs(Main, {
                            grow: 1,
                            height: "100dvh",
                            background: "neutral100",
                            paddingBottom: 6,
                            overflow: "auto",
                            labelledBy: headerId,
                            children: [
                                /*#__PURE__*/ jsx(VersionHeader, {
                                    headerId: headerId
                                }),
                                /*#__PURE__*/ jsx(VersionContent, {})
                            ]
                        }),
                        /*#__PURE__*/ jsx(VersionsList, {})
                    ]
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedHistoryPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedHistoryPageImpl = ()=>{
    const { slug } = useParams();
    const { permissions = [], isLoading, error } = useRBAC(PERMISSIONS.map((action)=>({
            action,
            subject: slug
        })));
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    if (error || !slug) {
        return /*#__PURE__*/ jsx(Box, {
            height: "100dvh",
            width: "100dvw",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 4,
            background: "neutral0",
            children: /*#__PURE__*/ jsx(Page.Error, {})
        });
    }
    return /*#__PURE__*/ jsx(Box, {
        height: "100dvh",
        width: "100dvw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 4,
        background: "neutral0",
        children: /*#__PURE__*/ jsx(Page.Protect, {
            permissions: permissions,
            children: ({ permissions })=>/*#__PURE__*/ jsx(DocumentRBAC, {
                    permissions: permissions,
                    children: /*#__PURE__*/ jsx(HistoryPage, {})
                })
        })
    });
};
const ProtectedHistoryPage = ()=>{
    return /*#__PURE__*/ jsx(Portal, {
        children: /*#__PURE__*/ jsx(FocusTrap, {
            children: /*#__PURE__*/ jsx(ProtectedHistoryPageImpl, {})
        })
    });
};

export { HistoryProvider, ProtectedHistoryPage, useHistoryContext };
//# sourceMappingURL=History.mjs.map
