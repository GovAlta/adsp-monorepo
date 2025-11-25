import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Popover, Button, Flex, Box, Tag, MultiSelect, MultiSelectOption } from '@strapi/design-system';
import { Filter, Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';

const NpmPackagesFilters = ({ handleSelectClear, handleSelectChange, npmPackageType, possibleCategories, possibleCollections, query })=>{
    const { formatMessage } = useIntl();
    const handleTagRemove = (tagToRemove, filterType)=>{
        const update = {
            [filterType]: (query[filterType] ?? []).filter((previousTag)=>previousTag !== tagToRemove)
        };
        handleSelectChange(update);
    };
    return /*#__PURE__*/ jsxs(Popover.Root, {
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "tertiary",
                    startIcon: /*#__PURE__*/ jsx(Filter, {}),
                    children: formatMessage({
                        id: 'app.utils.filters',
                        defaultMessage: 'Filters'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                sideOffset: 4,
                children: /*#__PURE__*/ jsxs(Flex, {
                    padding: 3,
                    direction: "column",
                    alignItems: "stretch",
                    gap: 1,
                    children: [
                        /*#__PURE__*/ jsx(FilterSelect, {
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
                        npmPackageType === 'plugin' && /*#__PURE__*/ jsx(FilterSelect, {
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
            query.collections?.map((collection)=>/*#__PURE__*/ jsx(Box, {
                    padding: 1,
                    children: /*#__PURE__*/ jsx(Tag, {
                        icon: /*#__PURE__*/ jsx(Cross, {}),
                        onClick: ()=>handleTagRemove(collection, 'collections'),
                        children: collection
                    })
                }, collection)),
            npmPackageType === 'plugin' && query.categories?.map((category)=>/*#__PURE__*/ jsx(Box, {
                    padding: 1,
                    children: /*#__PURE__*/ jsx(Tag, {
                        icon: /*#__PURE__*/ jsx(Cross, {}),
                        onClick: ()=>handleTagRemove(category, 'categories'),
                        children: category
                    })
                }, category))
        ]
    });
};
const FilterSelect = ({ message, value, onChange, possibleFilters, onClear, customizeContent })=>{
    return /*#__PURE__*/ jsx(MultiSelect, {
        "data-testid": `${message}-button`,
        "aria-label": message,
        placeholder: message,
        onChange: onChange,
        onClear: onClear,
        value: value,
        customizeContent: customizeContent,
        children: Object.entries(possibleFilters).map(([filterName, count])=>{
            return /*#__PURE__*/ jsx(MultiSelectOption, {
                "data-testid": `${filterName}-${count}`,
                value: filterName,
                children: `${filterName} (${count})`
            }, filterName);
        })
    });
};

export { NpmPackagesFilters };
//# sourceMappingURL=NpmPackagesFilters.mjs.map
