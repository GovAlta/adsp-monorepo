'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var collections = require('../../constants/collections.js');
var plugin = require('../../constants/plugin.js');
var DocumentRBAC = require('../../features/DocumentRBAC.js');
var useDocument = require('../../hooks/useDocument.js');
var useDocumentLayout = require('../../hooks/useDocumentLayout.js');
var contentTypes = require('../../services/contentTypes.js');
var api = require('../../utils/api.js');
var VersionContent = require('../components/VersionContent.js');
var VersionHeader = require('../components/VersionHeader.js');
var VersionsList = require('../components/VersionsList.js');
var historyVersion = require('../services/historyVersion.js');

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

const [HistoryProvider, useHistoryContext] = strapiAdmin.createContext('HistoryPage');
/* -------------------------------------------------------------------------------------------------
 * HistoryPage
 * -----------------------------------------------------------------------------------------------*/ const HistoryPage = ()=>{
    const headerId = React__namespace.useId();
    const { formatMessage } = reactIntl.useIntl();
    const { slug, id: documentId, collectionType } = reactRouterDom.useParams();
    const { isLoading: isLoadingDocument, schema } = useDocument.useDocument({
        collectionType: collectionType,
        model: slug
    });
    const { isLoading: isLoadingLayout, edit: { layout, settings: { displayName, mainField } } } = useDocumentLayout.useDocumentLayout(slug);
    const { data: configuration, isLoading: isLoadingConfiguration } = contentTypes.useGetContentTypeConfigurationQuery(slug);
    // Parse state from query params
    const [{ query }] = strapiAdmin.useQueryParams();
    const { id: selectedVersionId, ...queryWithoutId } = query;
    const validQueryParamsWithoutId = api.buildValidParams(queryWithoutId);
    const page = validQueryParamsWithoutId.page ? Number(validQueryParamsWithoutId.page) : 1;
    const versionsResponse = historyVersion.useGetHistoryVersionsQuery({
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
   */ const initialRequestId = React__namespace.useRef(versionsResponse.requestId);
    const isStaleRequest = versionsResponse.requestId === initialRequestId.current;
    /**
   * Ensure that we have the necessary data to render the page:
   * - slug for single types
   * - slug _and_ documentId for collection types
   */ if (!slug || collectionType === collections.COLLECTION_TYPES && !documentId) {
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: "/content-manager"
        });
    }
    if (isLoadingDocument || isLoadingLayout || versionsResponse.isFetching || isStaleRequest || isLoadingConfiguration) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    // It was a success, handle empty data
    if (!versionsResponse.isError && !versionsResponse.data?.data?.length) {
        return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.NoData, {
                action: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                    tag: reactRouterDom.NavLink,
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
        return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
            to: {
                search: qs.stringify({
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
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: formatMessage({
                    id: 'content-manager.history.page-title',
                    defaultMessage: '{contentType} history'
                }, {
                    contentType: displayName
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(HistoryProvider, {
                contentType: slug,
                id: documentId,
                schema: schema,
                layout: layout,
                configuration: configuration,
                selectedVersion: selectedVersion,
                versions: versionsResponse.data,
                page: page,
                mainField: mainField,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "row",
                    alignItems: "flex-start",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Main, {
                            grow: 1,
                            height: "100dvh",
                            background: "neutral100",
                            paddingBottom: 6,
                            overflow: "auto",
                            labelledBy: headerId,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(VersionHeader.VersionHeader, {
                                    headerId: headerId
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(VersionContent.VersionContent, {})
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(VersionsList.VersionsList, {})
                    ]
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ProtectedHistoryPage
 * -----------------------------------------------------------------------------------------------*/ const ProtectedHistoryPageImpl = ()=>{
    const { slug } = reactRouterDom.useParams();
    const { permissions = [], isLoading, error } = strapiAdmin.useRBAC(plugin.PERMISSIONS.map((action)=>({
            action,
            subject: slug
        })));
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    if (error || !slug) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            height: "100dvh",
            width: "100dvw",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 4,
            background: "neutral0",
            children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {})
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        height: "100dvh",
        width: "100dvw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 4,
        background: "neutral0",
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
            permissions: permissions,
            children: ({ permissions })=>/*#__PURE__*/ jsxRuntime.jsx(DocumentRBAC.DocumentRBAC, {
                    permissions: permissions,
                    children: /*#__PURE__*/ jsxRuntime.jsx(HistoryPage, {})
                })
        })
    });
};
const ProtectedHistoryPage = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Portal, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.FocusTrap, {
            children: /*#__PURE__*/ jsxRuntime.jsx(ProtectedHistoryPageImpl, {})
        })
    });
};

exports.HistoryProvider = HistoryProvider;
exports.ProtectedHistoryPage = ProtectedHistoryPage;
exports.useHistoryContext = useHistoryContext;
//# sourceMappingURL=History.js.map
