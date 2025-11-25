'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var InjectionZone = require('../../../components/InjectionZone.js');
var useDocument = require('../../../hooks/useDocument.js');
var router = require('../../../router.js');
var DocumentActions = require('./DocumentActions.js');

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

/* -------------------------------------------------------------------------------------------------
 * Panels
 * -----------------------------------------------------------------------------------------------*/ const Panels = ()=>{
    const isCloning = reactRouterDom.useMatch(router.CLONE_PATH) !== null;
    const [{ query: { status } }] = strapiAdmin.useQueryParams({
        status: 'draft'
    });
    const { model, id, document, meta, collectionType } = useDocument.useDoc();
    const plugins = strapiAdmin.useStrapiApp('Panels', (state)=>state.plugins);
    const props = {
        activeTab: status,
        model,
        documentId: id,
        document: isCloning ? undefined : document,
        meta: isCloning ? undefined : meta,
        collectionType
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.DescriptionComponentRenderer, {
            props: props,
            descriptions: plugins['content-manager'].apis.getEditViewSidePanels(),
            children: (panels)=>panels.map(({ content, id, ...description })=>/*#__PURE__*/ jsxRuntime.jsx(Panel, {
                        ...description,
                        children: content
                    }, id))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Default Action Panels (CE)
 * -----------------------------------------------------------------------------------------------*/ const ActionsPanel = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return {
        title: formatMessage({
            id: 'content-manager.containers.edit.panels.default.title',
            defaultMessage: 'Entry'
        }),
        content: /*#__PURE__*/ jsxRuntime.jsx(ActionsPanelContent, {})
    };
};
ActionsPanel.type = 'actions';
const ActionsPanelContent = ()=>{
    const isCloning = reactRouterDom.useMatch(router.CLONE_PATH) !== null;
    const [{ query: { status = 'draft' } }] = strapiAdmin.useQueryParams();
    const { model, id, document, meta, collectionType } = useDocument.useDoc();
    const plugins = strapiAdmin.useStrapiApp('ActionsPanel', (state)=>state.plugins);
    const props = {
        activeTab: status,
        model,
        documentId: id,
        document: isCloning ? undefined : document,
        meta: isCloning ? undefined : meta,
        collectionType
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        gap: 2,
        width: "100%",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.DescriptionComponentRenderer, {
                props: props,
                descriptions: plugins['content-manager'].apis.getDocumentActions('panel'),
                children: (actions)=>/*#__PURE__*/ jsxRuntime.jsx(DocumentActions.DocumentActions, {
                        actions: actions
                    })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(InjectionZone.InjectionZone, {
                area: "editView.right-links",
                slug: model
            })
        ]
    });
};
const Panel = /*#__PURE__*/ React__namespace.forwardRef(({ children, title }, ref)=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        ref: ref,
        tag: "aside",
        "aria-labelledby": "additional-information",
        background: "neutral0",
        borderColor: "neutral150",
        hasRadius: true,
        paddingBottom: 4,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        shadow: "tableShadow",
        gap: 3,
        direction: "column",
        justifyContent: "stretch",
        alignItems: "flex-start",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                tag: "h2",
                variant: "sigma",
                textTransform: "uppercase",
                textColor: "neutral600",
                children: title
            }),
            children
        ]
    });
});

exports.ActionsPanel = ActionsPanel;
exports.Panels = Panels;
//# sourceMappingURL=Panels.js.map
