'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var pluginId = require('../../pluginId.js');
var getTrad = require('../../utils/getTrad.js');
var useDataManager = require('../DataManager/useDataManager.js');
var useFormModalNavigation = require('../FormModalNavigation/useFormModalNavigation.js');

const useContentTypeBuilderMenu = ()=>{
    const { componentsGroupedByCategory, isInDevelopmentMode, sortedContentTypesList } = useDataManager.useDataManager();
    const { trackUsage } = strapiAdmin.useTracking();
    const [searchValue, setSearchValue] = React.useState('');
    const { onOpenModalCreateSchema } = useFormModalNavigation.useFormModalNavigation();
    const { locale } = reactIntl.useIntl();
    const { startsWith } = designSystem.useFilter(locale, {
        sensitivity: 'base'
    });
    const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const handleClickOpenModalCreateCollectionType = ()=>{
        trackUsage(`willCreateContentType`);
        const nextState = {
            modalType: 'contentType',
            kind: 'collectionType',
            actionType: 'create',
            forTarget: 'contentType'
        };
        onOpenModalCreateSchema(nextState);
    };
    const handleClickOpenModalCreateSingleType = ()=>{
        trackUsage(`willCreateSingleType`);
        const nextState = {
            modalType: 'contentType',
            kind: 'singleType',
            actionType: 'create',
            forTarget: 'contentType'
        };
        onOpenModalCreateSchema(nextState);
    };
    const handleClickOpenModalCreateComponent = ()=>{
        trackUsage('willCreateComponent');
        const nextState = {
            modalType: 'component',
            kind: null,
            actionType: 'create',
            forTarget: 'component'
        };
        onOpenModalCreateSchema(nextState);
    };
    const componentsData = Object.entries(componentsGroupedByCategory).map(([category, components])=>({
            name: category,
            title: upperFirst(category),
            links: components.map((component)=>({
                    name: component.uid,
                    to: `/plugins/${pluginId.pluginId}/component-categories/${category}/${component.uid}`,
                    title: component.info.displayName,
                    status: component.status
                })).sort((a, b)=>formatter.compare(a.title, b.title))
        })).sort((a, b)=>formatter.compare(a.title, b.title));
    const displayedContentTypes = sortedContentTypesList.filter((obj)=>obj.visible).map((info)=>({
            kind: info.kind,
            name: info.name,
            to: info.to,
            title: info.title,
            status: info.status
        }));
    const data = [
        {
            name: 'models',
            title: {
                id: `${getTrad.getTrad('menu.section.models.name')}`,
                defaultMessage: 'Collection Types'
            },
            customLink: isInDevelopmentMode ? {
                id: `${getTrad.getTrad('button.model.create')}`,
                defaultMessage: 'Create new collection type',
                onClick: handleClickOpenModalCreateCollectionType
            } : undefined,
            links: displayedContentTypes.filter((contentType)=>contentType.kind === 'collectionType')
        },
        {
            name: 'singleTypes',
            title: {
                id: `${getTrad.getTrad('menu.section.single-types.name')}`,
                defaultMessage: 'Single Types'
            },
            customLink: isInDevelopmentMode ? {
                id: `${getTrad.getTrad('button.single-types.create')}`,
                defaultMessage: 'Create new single type',
                onClick: handleClickOpenModalCreateSingleType
            } : undefined,
            links: displayedContentTypes.filter((singleType)=>singleType.kind === 'singleType')
        },
        {
            name: 'components',
            title: {
                id: `${getTrad.getTrad('menu.section.components.name')}`,
                defaultMessage: 'Components'
            },
            customLink: isInDevelopmentMode ? {
                id: `${getTrad.getTrad('button.component.create')}`,
                defaultMessage: 'Create a new component',
                onClick: handleClickOpenModalCreateComponent
            } : undefined,
            links: componentsData
        }
    ].map((section)=>{
        const hasChild = section.links.some((l)=>'links' in l && Array.isArray(l.links));
        if (hasChild) {
            let filteredLinksCount = 0;
            return {
                ...section,
                links: section.links.reduce((acc, link)=>{
                    const filteredLinks = 'links' in link ? link.links.filter((link)=>startsWith(link.title, searchValue)) : [];
                    if (filteredLinks.length === 0) {
                        return acc;
                    }
                    filteredLinksCount += filteredLinks.length;
                    acc.push({
                        ...link,
                        links: filteredLinks.sort((a, b)=>formatter.compare(a.title, b.title))
                    });
                    return acc;
                }, []),
                linksCount: filteredLinksCount
            };
        }
        const filteredLinks = section.links.filter((link)=>startsWith(link.title, searchValue)).sort((a, b)=>formatter.compare(a.title, b.title));
        return {
            ...section,
            links: filteredLinks,
            linksCount: filteredLinks.length
        };
    });
    return {
        menu: data,
        search: {
            value: searchValue,
            onChange: setSearchValue,
            clear: ()=>setSearchValue('')
        }
    };
};

exports.useContentTypeBuilderMenu = useContentTypeBuilderMenu;
//# sourceMappingURL=useContentTypeBuilderMenu.js.map
