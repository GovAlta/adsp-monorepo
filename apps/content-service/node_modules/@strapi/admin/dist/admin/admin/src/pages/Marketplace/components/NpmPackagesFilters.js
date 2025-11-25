'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');

const NpmPackagesFilters = ({ handleSelectClear, handleSelectChange, npmPackageType, possibleCategories, possibleCollections, query })=>{
    const { formatMessage } = reactIntl.useIntl();
    const handleTagRemove = (tagToRemove, filterType)=>{
        const update = {
            [filterType]: (query[filterType] ?? []).filter((previousTag)=>previousTag !== tagToRemove)
        };
        handleSelectChange(update);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "tertiary",
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Filter, {}),
                    children: formatMessage({
                        id: 'app.utils.filters',
                        defaultMessage: 'Filters'
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                sideOffset: 4,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    padding: 3,
                    direction: "column",
                    alignItems: "stretch",
                    gap: 1,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(FilterSelect, {
                            message: formatMessage({
                                id: 'admin.pages.MarketPlacePage.filters.collections',
                                defaultMessage: 'Collections'
                            }),
                            value: query?.collections || [],
                            onChange: (newCollections)=>{
                                const update = {
                                    collections: newCollections
                                };
                                handleSelectChange(update);
                            },
                            onClear: ()=>handleSelectClear('collections'),
                            possibleFilters: possibleCollections,
                            customizeContent: (values)=>formatMessage({
                                    id: 'admin.pages.MarketPlacePage.filters.collectionsSelected',
                                    defaultMessage: '{count, plural, =0 {No collections} one {# collection} other {# collections}} selected'
                                }, {
                                    count: values?.length ?? 0
                                })
                        }),
                        npmPackageType === 'plugin' && /*#__PURE__*/ jsxRuntime.jsx(FilterSelect, {
                            message: formatMessage({
                                id: 'admin.pages.MarketPlacePage.filters.categories',
                                defaultMessage: 'Categories'
                            }),
                            value: query?.categories || [],
                            onChange: (newCategories)=>{
                                const update = {
                                    categories: newCategories
                                };
                                handleSelectChange(update);
                            },
                            onClear: ()=>handleSelectClear('categories'),
                            possibleFilters: possibleCategories,
                            customizeContent: (values)=>formatMessage({
                                    id: 'admin.pages.MarketPlacePage.filters.categoriesSelected',
                                    defaultMessage: '{count, plural, =0 {No categories} one {# category} other {# categories}} selected'
                                }, {
                                    count: values?.length ?? 0
                                })
                        })
                    ]
                })
            }),
            query.collections?.map((collection)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    padding: 1,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tag, {
                        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
                        onClick: ()=>handleTagRemove(collection, 'collections'),
                        children: collection
                    })
                }, collection)),
            npmPackageType === 'plugin' && query.categories?.map((category)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    padding: 1,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tag, {
                        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
                        onClick: ()=>handleTagRemove(category, 'categories'),
                        children: category
                    })
                }, category))
        ]
    });
};
const FilterSelect = ({ message, value, onChange, possibleFilters, onClear, customizeContent })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelect, {
        "data-testid": `${message}-button`,
        "aria-label": message,
        placeholder: message,
        onChange: onChange,
        onClear: onClear,
        value: value,
        customizeContent: customizeContent,
        children: Object.entries(possibleFilters).map(([filterName, count])=>{
            return /*#__PURE__*/ jsxRuntime.jsx(designSystem.MultiSelectOption, {
                "data-testid": `${filterName}-${count}`,
                value: filterName,
                children: `${filterName} (${count})`
            }, filterName);
        })
    });
};

exports.NpmPackagesFilters = NpmPackagesFilters;
//# sourceMappingURL=NpmPackagesFilters.js.map
