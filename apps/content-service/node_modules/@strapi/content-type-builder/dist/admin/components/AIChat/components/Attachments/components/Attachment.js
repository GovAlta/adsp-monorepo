'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');

const AttachmentContext = /*#__PURE__*/ React.createContext({
    error: null
});
const useAttachmentContext = ()=>React.useContext(AttachmentContext);
const StyledRoot = styledComponents.styled(designSystem.Box)`
  &:hover {
    cursor: pointer;
    background: ${({ theme })=>theme.colors.neutral100};
  }
`;
// TODO: How to make this a button instead?
const Root = ({ children, error = null, minWidth, maxWidth })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(AttachmentContext.Provider, {
        value: {
            error
        },
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "flex-start",
            gap: 2,
            minWidth: minWidth,
            maxWidth: maxWidth,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(StyledRoot, {
                    background: "neutral0",
                    hasRadius: true,
                    borderColor: "neutral200",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    padding: 2,
                    width: "100%",
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        gap: 2,
                        children: children
                    })
                }),
                error && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        alignItems: "center",
        justifyContent: "center",
        children: error ? /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {
            fill: "danger500"
        }) : children
    });
};
const Title = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        grow: 1,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        alignItems: "center",
        justifyContent: "center",
        shrink: 0,
        onClick: onClick,
        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Trash, {
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

exports.Attachment = Attachment;
exports.useAttachmentContext = useAttachmentContext;
//# sourceMappingURL=Attachment.js.map
