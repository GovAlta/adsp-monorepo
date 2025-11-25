'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');

// TODO: find a better naming convention for the file that was an index file before
const BoxOutline = styledComponents.styled(designSystem.Box)`
  &:focus {
    outline: 2px solid ${({ theme })=>theme.colors.primary600};
    outline-offset: -2px;
  }
`;
const BoxTextDecoration = styledComponents.styled(BoxOutline)`
  text-decoration: none;
`;
const FolderCardBodyAction = ({ to, ...props })=>{
    if (to) {
        return /*#__PURE__*/ jsxRuntime.jsx(BoxTextDecoration, {
            // padding needed to give outline space to appear
            // since FolderCardBody needs overflow hidden property
            padding: 1,
            tag: reactRouterDom.NavLink,
            maxWidth: "100%",
            to: to,
            ...props
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(BoxOutline, {
        padding: 1,
        tag: "button",
        type: "button",
        maxWidth: "100%",
        ...props
    });
};

exports.FolderCardBodyAction = FolderCardBodyAction;
//# sourceMappingURL=FolderCardBodyAction.js.map
