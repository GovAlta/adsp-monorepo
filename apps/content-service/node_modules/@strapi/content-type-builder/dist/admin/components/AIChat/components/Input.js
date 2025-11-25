'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var styledComponents = require('styled-components');

const InputContext = /*#__PURE__*/ React.createContext({});
const useInput = ()=>React.useContext(InputContext);
const Root = ({ children, isLoading = false, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(InputContext.Provider, {
        value: {
            isLoading
        },
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: 'flex-start',
            width: "100%",
            position: "relative",
            ...props,
            children: children
        })
    });
};
const Header = ({ children, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        position: "absolute",
        bottom: '102%',
        left: 0,
        right: 0,
        background: "neutral0",
        width: "100%",
        ...props,
        children: children
    });
};
const HeaderItem = styledComponents.styled(designSystem.Box)`
  padding: ${({ theme })=>theme.spaces[3]} 0};
`;
const Attachments = ({ children, gap = 2, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        gap: gap,
        wrap: "wrap",
        paddingBottom: 2,
        maxHeight: "150px",
        overflow: "auto",
        ...props,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Input Content
 * -----------------------------------------------------------------------------------------------*/ const InputContainer = styledComponents.styled(designSystem.Box)`
  outline: none;
  box-shadow: none;
  transition-property: border-color, box-shadow, fill;
  transition-duration: 0.2s;

  &:focus-within {
    border: 1px solid
      ${({ theme, $hasError })=>$hasError ? theme.colors.danger600 : theme.colors.primary600};
    box-shadow: ${({ theme, $hasError })=>$hasError ? theme.colors.danger600 : theme.colors.primary600}
      0px 0px 0px 2px;
  }
`;
const Content = ({ children, disclaimer, error = false, ...props })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(InputContainer, {
        background: "neutral0",
        hasRadius: true,
        borderColor: error ? 'danger600' : 'neutral200',
        borderWidth: "1px",
        borderStyle: "solid",
        width: "100%",
        $hasError: error,
        ...props,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                padding: 3,
                children: children
            }),
            disclaimer && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                background: "neutral100",
                padding: [
                    2,
                    3
                ],
                borderColor: "neutral200",
                borderWidth: "1px 0 0 0",
                borderStyle: "solid",
                borderRadius: '0 0 4px 4px',
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    variant: "pi",
                    textColor: "neutral600",
                    children: disclaimer
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Input Actions
 * -----------------------------------------------------------------------------------------------*/ const Actions = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 2,
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Input Compound
 * -----------------------------------------------------------------------------------------------*/ const Input = {
    Root,
    Header,
    HeaderItem,
    Attachments,
    Content,
    Actions,
    useInput
};

exports.Input = Input;
exports.InputContext = InputContext;
exports.Root = Root;
exports.useInput = useInput;
//# sourceMappingURL=Input.js.map
