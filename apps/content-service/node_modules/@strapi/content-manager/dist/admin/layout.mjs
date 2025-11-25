import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import 'react';
import { useIsMobile, Page, SubNav, Layouts } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { useMatch, useLocation, Navigate, Outlet } from 'react-router-dom';
import { DragLayer } from './components/DragLayer.mjs';
import { CardDragPreview } from './components/DragPreviews/CardDragPreview.mjs';
import { ComponentDragPreview } from './components/DragPreviews/ComponentDragPreview.mjs';
import { RelationDragPreview } from './components/DragPreviews/RelationDragPreview.mjs';
import { LeftMenu } from './components/LeftMenu.mjs';
import { ItemTypes } from './constants/dragAndDrop.mjs';
import { useContentManagerInitData } from './hooks/useContentManagerInitData.mjs';
import { getTranslation } from './utils/translations.mjs';

/* -------------------------------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------------------------*/ const Layout = ()=>{
    const contentTypeMatch = useMatch('/content-manager/:kind/:uid/*');
    const isMobile = useIsMobile();
    const { isLoading, collectionTypeLinks, models, singleTypeLinks } = useContentManagerInitData();
    const authorisedModels = [
        ...collectionTypeLinks,
        ...singleTypeLinks
    ].sort((a, b)=>a.title.localeCompare(b.title));
    const { pathname } = useLocation();
    const { formatMessage } = useIntl();
    if (isLoading) {
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: getTranslation('plugin.name'),
                        defaultMessage: 'Content Manager'
                    })
                }),
                /*#__PURE__*/ jsx(Page.Loading, {})
            ]
        });
    }
    // Array of models that are displayed in the content manager
    const supportedModelsToDisplay = models.filter(({ isDisplayed })=>isDisplayed);
    // Redirect the user to the 403 page
    if (authorisedModels.length === 0 && supportedModelsToDisplay.length > 0 && pathname !== '/content-manager/403') {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/403"
        });
    }
    // Redirect the user to the create content type page
    if (supportedModelsToDisplay.length === 0 && pathname !== '/no-content-types') {
        return /*#__PURE__*/ jsx(Navigate, {
            to: "/no-content-types"
        });
    }
    // On /content-manager base route
    if (!contentTypeMatch && authorisedModels.length > 0) {
        // On desktop: redirect to first collection type
        if (!isMobile) {
            return /*#__PURE__*/ jsx(Navigate, {
                to: {
                    pathname: authorisedModels[0].to,
                    search: authorisedModels[0].search ?? ''
                },
                replace: true
            });
        }
        // On mobile: show navigation page
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: getTranslation('plugin.name'),
                        defaultMessage: 'Content Manager'
                    })
                }),
                /*#__PURE__*/ jsx(SubNav.PageWrapper, {
                    children: /*#__PURE__*/ jsx(LeftMenu, {
                        isFullPage: true
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: getTranslation('plugin.name'),
                    defaultMessage: 'Content Manager'
                })
            }),
            /*#__PURE__*/ jsxs(Layouts.Root, {
                sideNav: /*#__PURE__*/ jsx(LeftMenu, {}),
                children: [
                    /*#__PURE__*/ jsx(DragLayer, {
                        renderItem: renderDraglayerItem
                    }),
                    /*#__PURE__*/ jsx(Outlet, {})
                ]
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * renderDraglayerItem
 * -----------------------------------------------------------------------------------------------*/ function renderDraglayerItem({ type, item }) {
    if (!type || type && typeof type !== 'string') {
        return null;
    }
    /**
   * Because a user may have multiple relations / dynamic zones / repeable fields in the same content type,
   * we append the fieldName for the item type to make them unique, however, we then want to extract that
   * first type to apply the correct preview.
   */ const [actualType] = type.split('_');
    switch(actualType){
        case ItemTypes.EDIT_FIELD:
        case ItemTypes.FIELD:
            return /*#__PURE__*/ jsx(CardDragPreview, {
                label: item.label
            });
        case ItemTypes.COMPONENT:
        case ItemTypes.DYNAMIC_ZONE:
            return /*#__PURE__*/ jsx(ComponentDragPreview, {
                displayedValue: item.displayedValue
            });
        case ItemTypes.RELATION:
            return /*#__PURE__*/ jsx(RelationDragPreview, {
                ...item
            });
        default:
            return null;
    }
}

export { Layout };
//# sourceMappingURL=layout.mjs.map
