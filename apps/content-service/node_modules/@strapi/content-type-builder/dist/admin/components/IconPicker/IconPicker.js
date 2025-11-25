'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var getTrad = require('../../utils/getTrad.js');
var constants = require('./constants.js');

const IconPickerWrapper = styledComponents.styled(designSystem.Flex)`
  label {
    ${designSystem.inputFocusStyle()}
    border-radius: ${({ theme })=>theme.borderRadius};
    border: 1px solid ${({ theme })=>theme.colors.neutral100};
  }
`;
const IconPick = ({ iconKey, name, onChange, isSelected, ariaLabel })=>{
    const Icon = constants.COMPONENT_ICONS[iconKey];
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
        name: name,
        required: false,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Label, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.VisuallyHidden, {
                    children: [
                        ariaLabel,
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Input, {
                            type: "radio",
                            checked: isSelected,
                            onChange: onChange,
                            value: iconKey,
                            "aria-checked": isSelected
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                    label: iconKey,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        padding: 2,
                        cursor: "pointer",
                        hasRadius: true,
                        background: isSelected ? 'primary200' : undefined,
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icon, {
                            width: '2rem',
                            height: '2rem',
                            fill: isSelected ? 'primary600' : 'neutral300'
                        })
                    })
                })
            ]
        })
    });
};
const IconPicker = ({ intlLabel, name, onChange, value = '' })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [showSearch, setShowSearch] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const allIcons = Object.keys(constants.COMPONENT_ICONS);
    const [icons, setIcons] = React.useState(allIcons);
    const searchIconRef = React.useRef(null);
    const searchBarRef = React.useRef(null);
    const toggleSearch = ()=>{
        setShowSearch(!showSearch);
    };
    const onChangeSearch = ({ target: { value } })=>{
        setSearch(value);
        setIcons(()=>allIcons.filter((icon)=>icon.toLowerCase().includes(value.toLowerCase())));
    };
    const onClearSearch = ()=>{
        toggleSearch();
        setSearch('');
        setIcons(allIcons);
    };
    const removeIconSelected = ()=>{
        onChange({
            target: {
                name,
                value: ''
            }
        });
    };
    React.useEffect(()=>{
        if (showSearch) {
            searchBarRef.current?.focus();
        }
    }, [
        showSearch
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                justifyContent: "space-between",
                paddingBottom: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        fontWeight: "bold",
                        textColor: "neutral800",
                        tag: "label",
                        children: formatMessage(intlLabel)
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        gap: 1,
                        children: [
                            showSearch ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Searchbar, {
                                ref: searchBarRef,
                                name: "searchbar",
                                placeholder: formatMessage({
                                    id: getTrad.getTrad('ComponentIconPicker.search.placeholder'),
                                    defaultMessage: 'Search for an icon'
                                }),
                                onBlur: ()=>{
                                    if (!search) {
                                        toggleSearch();
                                    }
                                },
                                onChange: onChangeSearch,
                                value: search,
                                onClear: onClearSearch,
                                clearLabel: formatMessage({
                                    id: getTrad.getTrad('IconPicker.search.clear.label'),
                                    defaultMessage: 'Clear the icon search'
                                }),
                                children: formatMessage({
                                    id: getTrad.getTrad('IconPicker.search.placeholder.label'),
                                    defaultMessage: 'Search for an icon'
                                })
                            }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                ref: searchIconRef,
                                onClick: toggleSearch,
                                withTooltip: false,
                                label: formatMessage({
                                    id: getTrad.getTrad('IconPicker.search.button.label'),
                                    defaultMessage: 'Search icon button'
                                }),
                                variant: "ghost",
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Search, {})
                            }),
                            value && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                                label: formatMessage({
                                    id: getTrad.getTrad('IconPicker.remove.tooltip'),
                                    defaultMessage: 'Remove the selected icon'
                                }),
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    onClick: removeIconSelected,
                                    withTooltip: false,
                                    label: formatMessage({
                                        id: getTrad.getTrad('IconPicker.remove.button'),
                                        defaultMessage: 'Remove the selected icon'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {})
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(IconPickerWrapper, {
                position: "relative",
                padding: 1,
                background: "neutral100",
                hasRadius: true,
                wrap: "wrap",
                gap: 2,
                maxHeight: "126px",
                overflow: "auto",
                textAlign: "center",
                children: icons.length > 0 ? icons.map((iconKey)=>/*#__PURE__*/ jsxRuntime.jsx(IconPick, {
                        iconKey: iconKey,
                        name: name,
                        onChange: onChange,
                        isSelected: iconKey === value,
                        ariaLabel: formatMessage({
                            id: getTrad.getTrad('IconPicker.icon.label'),
                            defaultMessage: 'Select {icon} icon'
                        }, {
                            icon: iconKey
                        })
                    }, iconKey)) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    padding: 4,
                    grow: 2,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "delta",
                        textColor: "neutral600",
                        textAlign: "center",
                        children: formatMessage({
                            id: getTrad.getTrad('IconPicker.emptyState.label'),
                            defaultMessage: 'No icon found'
                        })
                    })
                })
            })
        ]
    });
};

exports.IconPicker = IconPicker;
//# sourceMappingURL=IconPicker.js.map
