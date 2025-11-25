'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var filters = require('../constants/filters.js');
var useControllableState = require('../hooks/useControllableState.js');
var useQueryParams = require('../hooks/useQueryParams.js');
var Context = require('./Context.js');
var Form = require('./Form.js');
var Renderer = require('./FormInputs/Renderer.js');

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

const [FiltersProvider, useFilters] = Context.createContext('Filters');
const Root = ({ children, disabled = false, onChange, options = [], onOpenChange, open: openProp, defaultOpen, ...restProps })=>{
    const handleChange = (data)=>{
        if (onChange) {
            onChange(data);
        }
    };
    const [open = false, setOpen] = useControllableState.useControllableState({
        prop: openProp,
        defaultProp: defaultOpen,
        onChange: onOpenChange
    });
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Root, {
        open: open,
        onOpenChange: setOpen,
        ...restProps,
        children: /*#__PURE__*/ jsxRuntime.jsx(FiltersProvider, {
            setOpen: setOpen,
            disabled: disabled,
            onChange: handleChange,
            options: options,
            children: children
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Trigger
 * -----------------------------------------------------------------------------------------------*/ const Trigger = /*#__PURE__*/ React__namespace.forwardRef(({ label }, forwardedRef)=>{
    const { formatMessage } = reactIntl.useIntl();
    const disabled = useFilters('Trigger', ({ disabled })=>disabled);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            variant: "tertiary",
            ref: forwardedRef,
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Filter, {}),
            size: "S",
            disabled: disabled,
            children: label || formatMessage({
                id: 'app.utils.filters',
                defaultMessage: 'Filters'
            })
        })
    });
});
/* -------------------------------------------------------------------------------------------------
 * Popover
 * -----------------------------------------------------------------------------------------------*/ /**
 * The zIndex property is used to override the zIndex of the Portal element of the Popover.
 * This is needed to ensure that the DatePicker is rendered above the Popover when opened.
 * The issue was that both the DatePicker and the Popover are rendered in a Portal and have the same zIndex.
 * On init, since the DatePicker is rendered before the Popover in the DOM,
 * it's causing the issue of appearing behind the Popover.
 */ const PopoverImpl = ({ zIndex })=>{
    const [{ query }, setQuery] = useQueryParams.useQueryParams();
    const { formatMessage } = reactIntl.useIntl();
    const options = useFilters('Popover', ({ options })=>options);
    const onChange = useFilters('Popover', ({ onChange })=>onChange);
    const setOpen = useFilters('Popover', ({ setOpen })=>setOpen);
    if (options.length === 0) {
        return null;
    }
    const handleSubmit = (data)=>{
        const value = filters.FILTERS_WITH_NO_VALUE.includes(data.filter) ? 'true' : encodeURIComponent(data.value ?? '');
        if (!value) {
            return;
        }
        if (onChange) {
            onChange(data);
        }
        /**
     * There will ALWAYS be an option because we use the options to create the form data.
     */ const fieldOptions = options.find((filter)=>filter.name === data.name);
        /**
     * If the filter is a relation, we need to nest the filter object,
     * we filter based on the mainField of the relation, if there is no mainField, we use the id.
     * At the end, we pass the operator & value. This value _could_ look like:
     * ```json
     * {
     *  "$eq": "1",
     * }
     * ```
     */ const operatorValuePairing = {
            [data.filter]: value
        };
        const newFilterQuery = {
            ...query.filters,
            $and: [
                ...query.filters?.$and ?? [],
                {
                    [data.name]: fieldOptions.type === 'relation' ? {
                        [fieldOptions.mainField?.name ?? 'id']: operatorValuePairing
                    } : operatorValuePairing
                }
            ]
        };
        setQuery({
            filters: newFilterQuery,
            page: 1
        });
        setOpen(false);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
        style: {
            zIndex
        },
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            padding: 3,
            children: /*#__PURE__*/ jsxRuntime.jsx(Form.Form, {
                method: "POST",
                initialValues: {
                    name: options[0]?.name,
                    filter: filters.BASE_FILTERS[0].value
                },
                onSubmit: handleSubmit,
                children: ({ values: formValues, modified, isSubmitting })=>{
                    const filter = options.find((filter)=>filter.name === formValues.name);
                    const Input = filter?.input || Renderer.InputRenderer;
                    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 2,
                        style: {
                            minWidth: 184
                        },
                        children: [
                            [
                                {
                                    ['aria-label']: formatMessage({
                                        id: 'app.utils.select-field',
                                        defaultMessage: 'Select field'
                                    }),
                                    name: 'name',
                                    options: options.map((filter)=>({
                                            label: filter.label,
                                            value: filter.name
                                        })),
                                    placholder: formatMessage({
                                        id: 'app.utils.select-field',
                                        defaultMessage: 'Select field'
                                    }),
                                    type: 'enumeration'
                                },
                                {
                                    ['aria-label']: formatMessage({
                                        id: 'app.utils.select-filter',
                                        defaultMessage: 'Select filter'
                                    }),
                                    name: 'filter',
                                    options: filter?.operators || getFilterList(filter).map((opt)=>({
                                            label: formatMessage(opt.label),
                                            value: opt.value
                                        })),
                                    placeholder: formatMessage({
                                        id: 'app.utils.select-filter',
                                        defaultMessage: 'Select filter'
                                    }),
                                    type: 'enumeration'
                                }
                            ].map((field)=>/*#__PURE__*/ jsxRuntime.jsx(Renderer.InputRenderer, {
                                    ...field
                                }, field.name)),
                            filter && formValues.filter && formValues.filter !== '$null' && formValues.filter !== '$notNull' ? /*#__PURE__*/ jsxRuntime.jsx(Input, {
                                ...filter,
                                label: null,
                                "aria-label": filter.label,
                                name: "value",
                                // @ts-expect-error – if type is `custom` then `Input` will be a custom component.
                                type: filter.mainField?.type ?? filter.type
                            }) : null,
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                disabled: !modified || isSubmitting,
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
                        ]
                    });
                }
            })
        })
    });
};
/**
 * Depending on the selected field find the possible filters to apply
 */ const getFilterList = (filter)=>{
    if (!filter) {
        return [];
    }
    const type = filter.mainField?.type ? filter.mainField.type : filter.type;
    switch(type){
        case 'email':
        case 'text':
        case 'string':
            {
                return [
                    ...filters.BASE_FILTERS,
                    ...filters.IS_SENSITIVE_FILTERS,
                    ...filters.CONTAINS_FILTERS,
                    ...filters.STRING_PARSE_FILTERS
                ];
            }
        case 'float':
        case 'integer':
        case 'biginteger':
        case 'decimal':
            {
                return [
                    ...filters.BASE_FILTERS,
                    ...filters.NUMERIC_FILTERS
                ];
            }
        case 'time':
        case 'date':
            {
                return [
                    ...filters.BASE_FILTERS,
                    ...filters.NUMERIC_FILTERS,
                    ...filters.CONTAINS_FILTERS
                ];
            }
        case 'datetime':
            {
                return [
                    ...filters.BASE_FILTERS,
                    ...filters.NUMERIC_FILTERS
                ];
            }
        case 'enumeration':
            {
                return filters.BASE_FILTERS;
            }
        default:
            return [
                ...filters.BASE_FILTERS,
                ...filters.IS_SENSITIVE_FILTERS
            ];
    }
};
/* -------------------------------------------------------------------------------------------------
 * List
 * -----------------------------------------------------------------------------------------------*/ const List = ()=>{
    const [{ query }, setQuery] = useQueryParams.useQueryParams();
    const options = useFilters('List', ({ options })=>options);
    const handleClick = (data)=>{
        /**
     * Check the name, operator and value to see if it already exists in the query
     * if it does, remove it.
     */ const nextFilters = (query?.filters?.$and ?? []).filter((filter)=>{
            const [attributeName] = Object.keys(filter);
            if (attributeName !== data.name) {
                return true;
            }
            const { type, mainField } = options.find(({ name })=>name === attributeName);
            if (type === 'relation') {
                const filterObj = filter[attributeName][mainField?.name ?? 'id'];
                if (typeof filterObj === 'object') {
                    const [operator] = Object.keys(filterObj);
                    const value = filterObj[operator];
                    return !(operator === data.filter && value === data.value);
                }
                return true;
            } else {
                const filterObj = filter[attributeName];
                const [operator] = Object.keys(filterObj);
                const value = filterObj[operator];
                return !(operator === data.filter && value === data.value);
            }
        });
        setQuery({
            filters: {
                $and: nextFilters
            },
            page: 1
        });
    };
    if (!query?.filters?.$and?.length) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: query?.filters?.$and?.map((queryFilter)=>{
            const [attributeName] = Object.keys(queryFilter);
            const filter = options.find(({ name })=>name === attributeName);
            const filterObj = queryFilter[attributeName];
            if (!filter || typeof filterObj !== 'object' || filterObj === null) {
                return null;
            }
            if (filter.type === 'relation') {
                const modelFilter = filterObj[filter.mainField?.name ?? 'id'];
                if (typeof modelFilter === 'object') {
                    const [operator] = Object.keys(modelFilter);
                    const value = modelFilter[operator];
                    return /*#__PURE__*/ jsxRuntime.jsx(AttributeTag, {
                        ...filter,
                        onClick: handleClick,
                        operator: operator,
                        value: value
                    }, `${attributeName}-${operator}-${value}`);
                }
                return null;
            } else {
                const [operator] = Object.keys(filterObj);
                const value = filterObj[operator];
                /**
           * Something has gone wrong here, because the attribute is not a relation
           * but we have a nested filter object.
           */ if (typeof value === 'object') {
                    return null;
                }
                return /*#__PURE__*/ jsxRuntime.jsx(AttributeTag, {
                    ...filter,
                    onClick: handleClick,
                    operator: operator,
                    value: value
                }, `${attributeName}-${operator}-${value}`);
            }
        })
    });
};
const AttributeTag = ({ input, label, mainField, name, onClick, operator, options, value, ...filter })=>{
    const { formatMessage, formatDate, formatTime, formatNumber } = reactIntl.useIntl();
    const handleClick = ()=>{
        onClick({
            name,
            value,
            filter: operator
        });
    };
    const type = mainField?.type ? mainField.type : filter.type;
    let formattedValue = value;
    switch(type){
        case 'date':
            formattedValue = formatDate(value, {
                dateStyle: 'full'
            });
            break;
        case 'datetime':
            formattedValue = formatDate(value, {
                dateStyle: 'full',
                timeStyle: 'short'
            });
            break;
        case 'time':
            const [hour, minute] = value.split(':');
            const date = new Date();
            date.setHours(Number(hour));
            date.setMinutes(Number(minute));
            formattedValue = formatTime(date, {
                hour: 'numeric',
                minute: 'numeric'
            });
            break;
        case 'float':
        case 'integer':
        case 'biginteger':
        case 'decimal':
            formattedValue = formatNumber(Number(value));
            break;
    }
    // Handle custom input
    if (input && options) {
        // If the custom input has an options array, find the option with a customValue matching the query value
        const selectedOption = options.find((option)=>{
            return (typeof option === 'string' ? option : option.value) === value;
        });
        formattedValue = selectedOption ? typeof selectedOption === 'string' ? selectedOption : selectedOption.label ?? selectedOption.value : value;
    }
    const content = `${label} ${formatMessage({
        id: `components.FilterOptions.FILTER_TYPES.${operator}`,
        defaultMessage: operator
    })} ${operator !== '$null' && operator !== '$notNull' ? formattedValue : ''}`;
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tag, {
        padding: 1,
        onClick: handleClick,
        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
        children: content
    });
};
/* -------------------------------------------------------------------------------------------------
 * EXPORTS
 * -----------------------------------------------------------------------------------------------*/ const Filters = {
    List,
    Popover: PopoverImpl,
    Root,
    Trigger
};

exports.Filters = Filters;
//# sourceMappingURL=Filters.js.map
