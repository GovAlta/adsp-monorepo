import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { Flex, inputFocusStyle, Typography, Searchbar, IconButton, Tooltip, Box, Field, VisuallyHidden } from '@strapi/design-system';
import { Search, Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { getTrad } from '../../utils/getTrad.mjs';
import { COMPONENT_ICONS } from './constants.mjs';

const IconPickerWrapper = styled(Flex)`
  label {
    ${inputFocusStyle()}
    border-radius: ${({ theme })=>theme.borderRadius};
    border: 1px solid ${({ theme })=>theme.colors.neutral100};
  }
`;
const IconPick = ({ iconKey, name, onChange, isSelected, ariaLabel })=>{
    const Icon = COMPONENT_ICONS[iconKey];
    return /*#__PURE__*/ jsx(Field.Root, {
        name: name,
        required: false,
        children: /*#__PURE__*/ jsxs(Field.Label, {
            children: [
                /*#__PURE__*/ jsxs(VisuallyHidden, {
                    children: [
                        ariaLabel,
                        /*#__PURE__*/ jsx(Field.Input, {
                            type: "radio",
                            checked: isSelected,
                            onChange: onChange,
                            value: iconKey,
                            "aria-checked": isSelected
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(Tooltip, {
                    label: iconKey,
                    children: /*#__PURE__*/ jsx(Flex, {
                        padding: 2,
                        cursor: "pointer",
                        hasRadius: true,
                        background: isSelected ? 'primary200' : undefined,
                        children: /*#__PURE__*/ jsx(Icon, {
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
    const { formatMessage } = useIntl();
    const [showSearch, setShowSearch] = useState(false);
    const [search, setSearch] = useState('');
    const allIcons = Object.keys(COMPONENT_ICONS);
    const [icons, setIcons] = useState(allIcons);
    const searchIconRef = useRef(null);
    const searchBarRef = useRef(null);
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
    useEffect(()=>{
        if (showSearch) {
            searchBarRef.current?.focus();
        }
    }, [
        showSearch
    ]);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                justifyContent: "space-between",
                paddingBottom: 2,
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        fontWeight: "bold",
                        textColor: "neutral800",
                        tag: "label",
                        children: formatMessage(intlLabel)
                    }),
                    /*#__PURE__*/ jsxs(Flex, {
                        gap: 1,
                        children: [
                            showSearch ? /*#__PURE__*/ jsx(Searchbar, {
                                ref: searchBarRef,
                                name: "searchbar",
                                placeholder: formatMessage({
                                    id: getTrad('ComponentIconPicker.search.placeholder'),
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
                                    id: getTrad('IconPicker.search.clear.label'),
                                    defaultMessage: 'Clear the icon search'
                                }),
                                children: formatMessage({
                                    id: getTrad('IconPicker.search.placeholder.label'),
                                    defaultMessage: 'Search for an icon'
                                })
                            }) : /*#__PURE__*/ jsx(IconButton, {
                                ref: searchIconRef,
                                onClick: toggleSearch,
                                withTooltip: false,
                                label: formatMessage({
                                    id: getTrad('IconPicker.search.button.label'),
                                    defaultMessage: 'Search icon button'
                                }),
                                variant: "ghost",
                                children: /*#__PURE__*/ jsx(Search, {})
                            }),
                            value && /*#__PURE__*/ jsx(Tooltip, {
                                label: formatMessage({
                                    id: getTrad('IconPicker.remove.tooltip'),
                                    defaultMessage: 'Remove the selected icon'
                                }),
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    onClick: removeIconSelected,
                                    withTooltip: false,
                                    label: formatMessage({
                                        id: getTrad('IconPicker.remove.button'),
                                        defaultMessage: 'Remove the selected icon'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Trash, {})
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx(IconPickerWrapper, {
                position: "relative",
                padding: 1,
                background: "neutral100",
                hasRadius: true,
                wrap: "wrap",
                gap: 2,
                maxHeight: "126px",
                overflow: "auto",
                textAlign: "center",
                children: icons.length > 0 ? icons.map((iconKey)=>/*#__PURE__*/ jsx(IconPick, {
                        iconKey: iconKey,
                        name: name,
                        onChange: onChange,
                        isSelected: iconKey === value,
                        ariaLabel: formatMessage({
                            id: getTrad('IconPicker.icon.label'),
                            defaultMessage: 'Select {icon} icon'
                        }, {
                            icon: iconKey
                        })
                    }, iconKey)) : /*#__PURE__*/ jsx(Box, {
                    padding: 4,
                    grow: 2,
                    children: /*#__PURE__*/ jsx(Typography, {
                        variant: "delta",
                        textColor: "neutral600",
                        textAlign: "center",
                        children: formatMessage({
                            id: getTrad('IconPicker.emptyState.label'),
                            defaultMessage: 'No icon found'
                        })
                    })
                })
            })
        ]
    });
};

export { IconPicker };
//# sourceMappingURL=IconPicker.mjs.map
