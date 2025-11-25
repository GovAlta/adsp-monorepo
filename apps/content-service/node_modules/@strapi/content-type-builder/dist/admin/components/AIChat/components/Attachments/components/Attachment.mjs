import { jsx, jsxs } from 'react/jsx-runtime';
import { createContext, useContext } from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import { WarningCircle, Trash } from '@strapi/icons';
import { styled } from 'styled-components';

const AttachmentContext = /*#__PURE__*/ createContext({
    error: null
});
const useAttachmentContext = ()=>useContext(AttachmentContext);
const StyledRoot = styled(Box)`
  &:hover {
    cursor: pointer;
    background: ${({ theme })=>theme.colors.neutral100};
  }
`;
// TODO: How to make this a button instead?
const Root = ({ children, error = null, minWidth, maxWidth })=>{
    return /*#__PURE__*/ jsx(AttachmentContext.Provider, {
        value: {
            error
        },
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "flex-start",
            gap: 2,
            minWidth: minWidth,
            maxWidth: maxWidth,
            children: [
                /*#__PURE__*/ jsx(StyledRoot, {
                    background: "neutral0",
                    hasRadius: true,
                    borderColor: "neutral200",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    padding: 2,
                    width: "100%",
                    children: /*#__PURE__*/ jsx(Flex, {
                        gap: 2,
                        children: children
                    })
                }),
                error && /*#__PURE__*/ jsx(Typography, {
                    variant: "pi",
                    textColor: "danger500",
                    children: error
                })
            ]
        })
    });
};
const Preview = ({ children })=>{
    const { error } = useAttachmentContext();
    return /*#__PURE__*/ jsx(Flex, {
        alignItems: "center",
        justifyContent: "center",
        children: error ? /*#__PURE__*/ jsx(WarningCircle, {
            fill: "danger500"
        }) : children
    });
};
const Title = ({ children })=>{
    return /*#__PURE__*/ jsx(Box, {
        grow: 1,
        children: /*#__PURE__*/ jsx(Typography, {
            variant: "omega",
            ellipsis: true,
            style: {
                userSelect: 'none',
                maxWidth: '100px'
            },
            children: children
        })
    });
};
const Remove = ({ onClick })=>{
    return /*#__PURE__*/ jsx(Flex, {
        alignItems: "center",
        justifyContent: "center",
        shrink: 0,
        onClick: onClick,
        children: /*#__PURE__*/ jsx(Trash, {
            fill: "neutral500"
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Attachment Compound
 * -----------------------------------------------------------------------------------------------*/ const Attachment = {
    Root,
    Preview,
    Title,
    Remove
};

export { Attachment, useAttachmentContext };
//# sourceMappingURL=Attachment.mjs.map
