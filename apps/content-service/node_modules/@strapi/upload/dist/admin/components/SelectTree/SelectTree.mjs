import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Box } from '@strapi/design-system';
import { Cross, CaretDown } from '@strapi/icons';
import ReactSelect, { components } from 'react-select';
import { styled, useTheme } from 'styled-components';
import { Option } from './Option.mjs';
import { flattenTree } from './utils/flattenTree.mjs';
import { getOpenValues } from './utils/getOpenValues.mjs';
import { getValuesToClose } from './utils/getValuesToClose.mjs';

const hasParent = (option)=>!option.parent;
const SelectTree = ({ options: defaultOptions, maxDisplayDepth = 5, defaultValue, ...props })=>{
    const flatDefaultOptions = React.useMemo(()=>flattenTree(defaultOptions), [
        defaultOptions
    ]);
    const optionsFiltered = React.useMemo(()=>flatDefaultOptions.filter(hasParent), [
        flatDefaultOptions
    ]);
    const [options, setOptions] = React.useState(optionsFiltered);
    const [openValues, setOpenValues] = React.useState(getOpenValues(flatDefaultOptions, defaultValue));
    React.useEffect(()=>{
        if (openValues.length === 0) {
            setOptions(flatDefaultOptions.filter((option)=>option.parent === undefined));
        } else {
            const allOpenValues = openValues.reduce((acc, value)=>{
                const options = flatDefaultOptions.filter((option)=>option.value === value || option.parent === value);
                options.forEach((option)=>{
                    const values = getOpenValues(flatDefaultOptions, option);
                    acc = [
                        ...acc,
                        ...values
                    ];
                });
                return acc;
            }, []);
            const nextOptions = flatDefaultOptions.filter((option)=>allOpenValues.includes(option.value));
            setOptions(nextOptions);
        }
    }, [
        openValues,
        flatDefaultOptions,
        optionsFiltered
    ]);
    const handleToggle = (value)=>{
        if (openValues.includes(value)) {
            const valuesToClose = getValuesToClose(flatDefaultOptions, value);
            setOpenValues((prev)=>prev.filter((prevData)=>!valuesToClose.includes(prevData)));
        } else {
            setOpenValues((prev)=>[
                    ...prev,
                    value
                ]);
        }
    };
    return /*#__PURE__*/ jsx(Select, {
        components: {
            Option
        },
        options: options,
        defaultValue: defaultValue,
        isSearchable: false,
        /* -- custom props, used by the Option component */ maxDisplayDepth: maxDisplayDepth,
        openValues: openValues,
        onOptionToggle: handleToggle,
        ...props
    });
};
const Select = ({ components = {}, styles = {}, error, ariaErrorMessage, ...props })=>{
    const theme = useTheme();
    const customStyles = getSelectStyles(theme, error);
    return /*#__PURE__*/ jsx(ReactSelect, {
        menuPosition: "fixed",
        components: {
            ...components,
            ClearIndicator,
            DropdownIndicator,
            IndicatorSeparator: ()=>null,
            LoadingIndicator: ()=>null
        },
        "aria-errormessage": error && ariaErrorMessage,
        "aria-invalid": !!error,
        styles: {
            ...customStyles,
            ...styles
        },
        ...props
    });
};
const IconBox = styled(Box)`
  background: transparent;
  border: none;
  position: relative;
  z-index: 1;

  svg {
    height: 1.1rem;
    width: 1.1rem;
  }

  svg path {
    fill: ${({ theme })=>theme.colors.neutral600};
  }
`;
const ClearIndicator = (props)=>{
    const Component = components.ClearIndicator;
    return /*#__PURE__*/ jsx(Component, {
        ...props,
        children: /*#__PURE__*/ jsx(IconBox, {
            tag: "button",
            type: "button",
            children: /*#__PURE__*/ jsx(Cross, {})
        })
    });
};
const CarretBox = styled(IconBox)`
  display: flex;
  background: none;
  border: none;

  svg {
    width: 0.9rem;
  }
`;
const DropdownIndicator = ({ innerProps })=>{
    return /*#__PURE__*/ jsx(CarretBox, {
        paddingRight: 3,
        ...innerProps,
        children: /*#__PURE__*/ jsx(CaretDown, {})
    });
};
const getSelectStyles = (theme, error)=>{
    return {
        clearIndicator: (base)=>({
                ...base,
                padding: 0,
                paddingRight: theme.spaces[3]
            }),
        container: (base)=>({
                ...base,
                background: theme.colors.neutral0,
                lineHeight: 'normal'
            }),
        control (base, state) {
            let borderColor = theme.colors.neutral200;
            let boxShadowColor = undefined;
            let backgroundColor = undefined;
            if (state.isFocused) {
                borderColor = theme.colors.primary600;
                boxShadowColor = theme.colors.primary600;
            } else if (error) {
                borderColor = theme.colors.danger600;
            }
            if (state.isDisabled) {
                backgroundColor = `${theme.colors.neutral150} !important`;
            }
            return {
                ...base,
                fontSize: theme.fontSizes[2],
                height: 40,
                border: `1px solid ${borderColor} !important`,
                outline: 0,
                backgroundColor,
                borderRadius: theme.borderRadius,
                boxShadow: boxShadowColor ? `${boxShadowColor} 0px 0px 0px 2px` : ''
            };
        },
        indicatorsContainer: (base)=>({
                ...base,
                padding: 0,
                paddingRight: theme.spaces[3]
            }),
        input: (base)=>({
                ...base,
                margin: 0,
                padding: 0,
                color: theme.colors.neutral800,
                gridTemplateColumns: '0 100%'
            }),
        menuPortal: (base)=>({
                ...base,
                zIndex: theme.zIndices.dialog,
                pointerEvents: 'auto'
            }),
        menu (base) {
            return {
                ...base,
                width: '100%',
                marginTop: theme.spaces[1],
                backgroundColor: theme.colors.neutral0,
                color: theme.colors.neutral800,
                borderRadius: theme.borderRadius,
                border: `1px solid ${theme.colors.neutral200}`,
                boxShadow: theme.shadows.tableShadow,
                fontSize: theme.fontSizes[2],
                zIndex: 2
            };
        },
        menuList: (base)=>({
                ...base,
                paddingLeft: theme.spaces[1],
                paddingTop: theme.spaces[1],
                paddingRight: theme.spaces[1],
                paddingBottom: theme.spaces[1]
            }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        option (base, state) {
            let backgroundColor = base?.backgroundColor;
            if (state.isFocused || state.isSelected) {
                backgroundColor = theme.colors.primary100;
            }
            return {
                ...base,
                color: theme.colors.neutral800,
                lineHeight: theme.spaces[5],
                backgroundColor,
                borderRadius: theme.borderRadius,
                '&:active': {
                    backgroundColor: theme.colors.primary100
                }
            };
        },
        placeholder: (base)=>({
                ...base,
                color: theme.colors.neutral600,
                marginLeft: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '80%'
            }),
        singleValue (base, state) {
            let color = theme.colors.neutral800;
            if (state.isDisabled) {
                color = theme.colors.neutral600;
            }
            return {
                ...base,
                marginLeft: 0,
                color
            };
        },
        valueContainer: (base)=>({
                ...base,
                cursor: 'pointer',
                padding: 0,
                paddingLeft: theme.spaces[4],
                marginLeft: 0,
                marginRight: 0
            })
    };
};

export { SelectTree };
//# sourceMappingURL=SelectTree.mjs.map
