'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var FilterValueInput = require('./FilterValueInput.js');
var getFilterList = require('./utils/getFilterList.js');

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

// TODO: find a better naming convention for the file that was an index file before
const FilterPopover = ({ displayedFilters, filters, onSubmit, onToggle })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [modifiedData, setModifiedData] = React__namespace.useState({
        name: 'createdAt',
        filter: '$eq',
        value: ''
    });
    const handleChangeFilterField = (value)=>{
        const nextField = displayedFilters.find((f)=>f.name === value);
        if (!nextField) {
            return;
        }
        const { fieldSchema: { type, options } } = nextField;
        let filterValue = '';
        if (type === 'enumeration') {
            filterValue = options?.[0].value || '';
        }
        const filter = getFilterList.getFilterList(nextField)[0].value;
        setModifiedData({
            name: value.toString(),
            filter,
            value: filterValue
        });
    };
    const handleChangeOperator = (operator)=>{
        if (modifiedData.name === 'mime') {
            setModifiedData((prev)=>({
                    ...prev,
                    filter: operator.toString(),
                    value: 'image'
                }));
        } else {
            setModifiedData((prev)=>({
                    ...prev,
                    filter: operator.toString(),
                    value: ''
                }));
        }
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        const encodedValue = encodeURIComponent(modifiedData.value);
        if (encodedValue) {
            if (modifiedData.name === 'mime') {
                const alreadyAppliedFilters = filters.filter((filter)=>{
                    return Object.keys(filter)[0] === 'mime';
                });
                if (modifiedData.value === 'file') {
                    const filtersWithoutMimeType = filters.filter((filter)=>{
                        return Object.keys(filter)[0] !== 'mime';
                    });
                    let hasCurrentFilter = false;
                    let filterToAdd;
                    if (modifiedData.filter === '$contains') {
                        hasCurrentFilter = alreadyAppliedFilters.find((filter)=>{
                            if (typeof filter.mime?.$not !== 'string' && !Array.isArray(filter.mime?.$not)) {
                                return filter.mime?.$not?.$contains !== undefined;
                            }
                        }) !== undefined;
                        filterToAdd = {
                            mime: {
                                $not: {
                                    $contains: [
                                        'image',
                                        'video'
                                    ]
                                }
                            }
                        };
                    } else {
                        hasCurrentFilter = alreadyAppliedFilters.find((filter)=>{
                            return Array.isArray(filter.mime?.$contains);
                        }) !== undefined;
                        filterToAdd = {
                            mime: {
                                $contains: [
                                    'image',
                                    'video'
                                ]
                            }
                        };
                    }
                    if (hasCurrentFilter) {
                        onToggle();
                        return;
                    }
                    const nextFilters = [
                        ...filtersWithoutMimeType,
                        filterToAdd
                    ];
                    onSubmit(nextFilters);
                    onToggle();
                    return;
                }
                const hasFilter = alreadyAppliedFilters.find((filter)=>{
                    const modifiedDataFilter = modifiedData.filter;
                    return filter.mime && filter.mime[modifiedDataFilter] === modifiedData.value;
                }) !== undefined;
                // Don't apply the same filter twice
                if (hasFilter) {
                    onToggle();
                    return;
                }
                const filtersWithoutFile = filters.filter((filter)=>{
                    const filterType = Object.keys(filter)[0];
                    if (filterType !== 'mime') {
                        return true;
                    }
                    if (typeof filter.mime?.$not !== 'string' && !Array.isArray(filter.mime?.$not) && filter.mime?.$not?.$contains !== undefined) {
                        return false;
                    }
                    if (Array.isArray(filter?.mime?.$contains)) {
                        return false;
                    }
                    return true;
                });
                const oppositeFilter = modifiedData.filter === '$contains' ? '$notContains' : '$contains';
                const oppositeFilterIndex = filtersWithoutFile.findIndex((filter)=>{
                    return filter.mime?.[oppositeFilter] === modifiedData.value;
                });
                const hasOppositeFilter = oppositeFilterIndex !== -1;
                const filterToAdd = {
                    [modifiedData.name]: {
                        [modifiedData.filter]: modifiedData.value
                    }
                };
                if (!hasOppositeFilter) {
                    const nextFilters = [
                        ...filtersWithoutFile,
                        filterToAdd
                    ];
                    onSubmit(nextFilters);
                    onToggle();
                    return;
                }
                if (hasOppositeFilter) {
                    const nextFilters = filtersWithoutFile.slice();
                    nextFilters.splice(oppositeFilterIndex, 1, filterToAdd);
                    onSubmit(nextFilters);
                    onToggle();
                }
                return;
            }
            const hasFilter = filters.find((filter)=>{
                const modifiedDataName = modifiedData.name;
                return filter[modifiedDataName] && filter[modifiedDataName]?.[modifiedDataName] === encodedValue;
            }) !== undefined;
            if (!hasFilter) {
                const filterToAdd = {
                    [modifiedData.name]: {
                        [modifiedData.filter]: encodedValue
                    }
                };
                const nextFilters = [
                    ...filters,
                    filterToAdd
                ];
                onSubmit(nextFilters);
            }
        }
        onToggle();
    };
    const appliedFilter = displayedFilters.find((filter)=>filter.name === modifiedData.name);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
        sideOffset: 4,
        style: {
            zIndex: 499
        },
        children: /*#__PURE__*/ jsxRuntime.jsx("form", {
            onSubmit: handleSubmit,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                padding: 3,
                direction: "column",
                alignItems: "stretch",
                gap: 1,
                style: {
                    minWidth: 184
                },
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                            "aria-label": formatMessage({
                                id: 'app.utils.select-field',
                                defaultMessage: 'Select field'
                            }),
                            name: "name",
                            size: "M",
                            onChange: handleChangeFilterField,
                            value: modifiedData.name,
                            children: displayedFilters.map((filter)=>{
                                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                    value: filter.name,
                                    children: filter.metadatas?.label
                                }, filter.name);
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                            "aria-label": formatMessage({
                                id: 'app.utils.select-filter',
                                defaultMessage: 'Select filter'
                            }),
                            name: "filter",
                            size: "M",
                            value: modifiedData.filter,
                            onChange: handleChangeOperator,
                            children: getFilterList.getFilterList(appliedFilter).map((option)=>{
                                return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                                    value: option.value,
                                    children: formatMessage(option.intlLabel)
                                }, option.value);
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(FilterValueInput.FilterValueInput, {
                            ...appliedFilter?.metadatas,
                            ...appliedFilter?.fieldSchema,
                            value: modifiedData.value,
                            onChange: (value)=>setModifiedData((prev)=>({
                                        ...prev,
                                        value
                                    }))
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            size: "L",
                            variant: "secondary",
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                            type: "submit",
                            fullWidth: true,
                            children: formatMessage({
                                id: 'app.utils.add-filter',
                                defaultMessage: 'Add filter'
                            })
                        })
                    })
                ]
            })
        })
    });
};

exports.FilterPopover = FilterPopover;
//# sourceMappingURL=FilterPopover.js.map
