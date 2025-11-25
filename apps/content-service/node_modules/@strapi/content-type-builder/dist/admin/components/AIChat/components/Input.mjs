import { jsx, jsxs } from 'react/jsx-runtime';
import { useContext, createContext } from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import { styled } from 'styled-components';

const InputContext = /*#__PURE__*/ createContext({});
const useInput = ()=>useContext(InputContext);
const Root = ({ children, isLoading = false, ...props })=>{
    return /*#__PURE__*/ jsx(InputContext.Provider, {
        value: {
            isLoading
        },
        children: /*#__PURE__*/ jsx(Flex, {
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
    return /*#__PURE__*/ jsx(Box, {
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
const HeaderItem = styled(Box)`
  padding: ${({ theme })=>theme.spaces[3]} 0};
`;
const Attachments = ({ children, gap = 2, ...props })=>{
    return /*#__PURE__*/ jsx(Flex, {
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
 * -----------------------------------------------------------------------------------------------*/ const InputContainer = styled(Box)`
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
    return /*#__PURE__*/ jsxs(InputContainer, {
        background: "neutral0",
        hasRadius: true,
        borderColor: error ? 'danger600' : 'neutral200',
        borderWidth: "1px",
        borderStyle: "solid",
        width: "100%",
        $hasError: error,
        ...props,
        children: [
            /*#__PURE__*/ jsx(Box, {
                padding: 3,
                children: children
            }),
            disclaimer && /*#__PURE__*/ jsx(Box, {
                background: "neutral100",
                padding: [
                    2,
                    3
                ],
                borderColor: "neutral200",
                borderWidth: "1px 0 0 0",
                borderStyle: "solid",
                borderRadius: '0 0 4px 4px',
                children: /*#__PURE__*/ jsx(Typography, {
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
    return /*#__PURE__*/ jsx(Flex, {
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

export { Input, InputContext, Root, useInput };
//# sourceMappingURL=Input.mjs.map
