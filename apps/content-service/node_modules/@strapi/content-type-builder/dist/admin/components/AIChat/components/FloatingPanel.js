'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');
var animations = require('./animations.js');

const PanelContext = /*#__PURE__*/ React.createContext({
    size: 'md',
    position: 'bottom-right',
    isOpen: false,
    onToggle: ()=>{}
});
const PANEL_SIZES = {
    sm: {
        width: '350px',
        height: '500px'
    },
    md: {
        width: '480px',
        height: '600px'
    },
    lg: {
        width: '600px',
        height: '700px'
    }
};
const PANEL_POSITIONS = {
    'bottom-right': {
        bottom: 4,
        right: 4
    },
    'bottom-left': {
        bottom: 4,
        left: 4
    },
    'top-right': {
        top: 4,
        right: 4
    },
    'top-left': {
        top: 4,
        left: 4
    }
};
const FixedWrapper = styledComponents.styled(designSystem.Box)`
  position: fixed;
  display: flex;
  flex-direction: column;
  z-index: 11;
  align-items: ${({ $position })=>$position.includes('right') ? 'flex-end' : 'flex-start'};
  ${({ $position, theme })=>Object.entries(PANEL_POSITIONS[$position]).reduce((acc, [key, value])=>({
            ...acc,
            [key]: theme.spaces[value]
        }), {})}
`;
const PanelContainer = styledComponents.styled(designSystem.Box)`
  width: ${({ $size })=>PANEL_SIZES[$size].width};
  max-height: 85vh;
  max-width: 85vw;
  display: flex;
  flex-direction: column;
  height: ${({ $size })=>PANEL_SIZES[$size].height};

  @media (prefers-reduced-motion: no-preference) {
    animation-duration: 200ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

    &[data-state='open'] {
      animation-name: ${({ $position })=>$position.startsWith('top') ? animations.ANIMATIONS.slideDownIn : animations.ANIMATIONS.slideUpIn};
    }

    &[data-state='closed'] {
      animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      animation-name: ${({ $position })=>$position.startsWith('top') ? animations.ANIMATIONS.slideDownOut : animations.ANIMATIONS.slideUpOut};
    }
  }
`;
const Root = ({ children, size = 'md', position = 'bottom-right', isOpen = false, onToggle = ()=>{}, toggleIcon })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(PanelContext.Provider, {
        value: {
            size,
            position,
            isOpen,
            onToggle
        },
        children: /*#__PURE__*/ jsxRuntime.jsxs(FixedWrapper, {
            $position: position,
            children: [
                isOpen ? /*#__PURE__*/ jsxRuntime.jsx(PanelContainer, {
                    $size: size,
                    $position: position,
                    background: "neutral0",
                    shadow: "popupShadow",
                    hasRadius: true,
                    borderColor: "neutral200",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    "data-state": isOpen ? 'open' : 'closed',
                    children: children
                }) : null,
                toggleIcon && !isOpen && toggleIcon
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Header
 * -----------------------------------------------------------------------------------------------*/ const Header = ({ children })=>// Adjust padding to fit title and right icons
    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: [
            2,
            2,
            2,
            4
        ],
        borderColor: "neutral150",
        borderStyle: "solid",
        borderWidth: "0 0 1px 0",
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            justifyContent: "space-between",
            alignItems: "center",
            children: children
        })
    });
/* -------------------------------------------------------------------------------------------------
 * Body
 * -----------------------------------------------------------------------------------------------*/ const Body = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 4,
        flex: "1",
        overflow: "auto",
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Footer
 * -----------------------------------------------------------------------------------------------*/ const Footer = ({ children })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        padding: 4,
        children: children
    });
/* -------------------------------------------------------------------------------------------------
 * Close Panel
 * -----------------------------------------------------------------------------------------------*/ const Close = ({ label })=>{
    const { onToggle } = usePanel();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
        onClick: onToggle,
        variant: "ghost",
        label: label || 'Close',
        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {})
    });
};
const Panel = {
    Root,
    Header,
    Body,
    Footer,
    Close
};
const usePanel = ()=>React.useContext(PanelContext);

exports.Panel = Panel;
exports.usePanel = usePanel;
//# sourceMappingURL=FloatingPanel.js.map
