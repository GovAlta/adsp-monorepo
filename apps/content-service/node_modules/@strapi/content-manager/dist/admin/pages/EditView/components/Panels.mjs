import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useQueryParams, useStrapiApp, DescriptionComponentRenderer } from '@strapi/admin/strapi-admin';
import { Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useMatch } from 'react-router-dom';
import { InjectionZone } from '../../../components/InjectionZone.mjs';
import { useDoc } from '../../../hooks/useDocument.mjs';
import { CLONE_PATH } from '../../../router.mjs';
import { DocumentActions } from './DocumentActions.mjs';

/* -------------------------------------------------------------------------------------------------
 * Panels
 * -----------------------------------------------------------------------------------------------*/ const Panels = ()=>{
    const isCloning = useMatch(CLONE_PATH) !== null;
    const [{ query: { status } }] = useQueryParams({
        status: 'draft'
    });
    const { model, id, document, meta, collectionType } = useDoc();
    const plugins = useStrapiApp('Panels', (state)=>state.plugins);
    const props = {
        activeTab: status,
        model,
        documentId: id,
        document: isCloning ? undefined : document,
        meta: isCloning ? undefined : meta,
        collectionType
    };
    return /*#__PURE__*/ jsx(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: /*#__PURE__*/ jsx(DescriptionComponentRenderer, {
            props: props,
            descriptions: plugins['content-manager'].apis.getEditViewSidePanels(),
            children: (panels)=>panels.map(({ content, id, ...description })=>/*#__PURE__*/ jsx(Panel, {
                        ...description,
                        children: content
                    }, id))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Default Action Panels (CE)
 * -----------------------------------------------------------------------------------------------*/ const ActionsPanel = ()=>{
    const { formatMessage } = useIntl();
    return {
        title: formatMessage({
            id: 'content-manager.containers.edit.panels.default.title',
            defaultMessage: 'Entry'
        }),
        content: /*#__PURE__*/ jsx(ActionsPanelContent, {})
    };
};
ActionsPanel.type = 'actions';
const ActionsPanelContent = ()=>{
    const isCloning = useMatch(CLONE_PATH) !== null;
    const [{ query: { status = 'draft' } }] = useQueryParams();
    const { model, id, document, meta, collectionType } = useDoc();
    const plugins = useStrapiApp('ActionsPanel', (state)=>state.plugins);
    const props = {
        activeTab: status,
        model,
        documentId: id,
        document: isCloning ? undefined : document,
        meta: isCloning ? undefined : meta,
        collectionType
    };
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 2,
        width: "100%",
        children: [
            /*#__PURE__*/ jsx(DescriptionComponentRenderer, {
                props: props,
                descriptions: plugins['content-manager'].apis.getDocumentActions('panel'),
                children: (actions)=>/*#__PURE__*/ jsx(DocumentActions, {
                        actions: actions
                    })
            }),
            /*#__PURE__*/ jsx(InjectionZone, {
                area: "editView.right-links",
                slug: model
            })
        ]
    });
};
const Panel = /*#__PURE__*/ React.forwardRef(({ children, title }, ref)=>{
    return /*#__PURE__*/ jsxs(Flex, {
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
            /*#__PURE__*/ jsx(Typography, {
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

export { ActionsPanel, Panels };
//# sourceMappingURL=Panels.mjs.map
