import { jsx, jsxs } from 'react/jsx-runtime';
import { useContext, createContext } from 'react';
import { Box, Flex, IconButton } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { styled } from 'styled-components';
import { ANIMATIONS } from './animations.mjs';

const PanelContext = /*#__PURE__*/ createContext({
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
const FixedWrapper = styled(Box)`
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
const PanelContainer = styled(Box)`
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
      animation-name: ${({ $position })=>$position.startsWith('top') ? ANIMATIONS.slideDownIn : ANIMATIONS.slideUpIn};
    }

    &[data-state='closed'] {
      animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
      animation-name: ${({ $position })=>$position.startsWith('top') ? ANIMATIONS.slideDownOut : ANIMATIONS.slideUpOut};
    }
  }
`;
const Root = ({ children, size = 'md', position = 'bottom-right', isOpen = false, onToggle = ()=>{}, toggleIcon })=>{
    return /*#__PURE__*/ jsx(PanelContext.Provider, {
        value: {
            size,
            position,
            isOpen,
            onToggle
        },
        children: /*#__PURE__*/ jsxs(FixedWrapper, {
            $position: position,
            children: [
                isOpen ? /*#__PURE__*/ jsx(PanelContainer, {
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
    /*#__PURE__*/ jsx(Box, {
        padding: [
            2,
            2,
            2,
            4
        ],
        borderColor: "neutral150",
        borderStyle: "solid",
        borderWidth: "0 0 1px 0",
        children: /*#__PURE__*/ jsx(Flex, {
            justifyContent: "space-between",
            alignItems: "center",
            children: children
        })
    });
/* -------------------------------------------------------------------------------------------------
 * Body
 * -----------------------------------------------------------------------------------------------*/ const Body = ({ children })=>{
    return /*#__PURE__*/ jsx(Box, {
        padding: 4,
        flex: "1",
        overflow: "auto",
        children: children
    });
};
/* -------------------------------------------------------------------------------------------------
 * Footer
 * -----------------------------------------------------------------------------------------------*/ const Footer = ({ children })=>/*#__PURE__*/ jsx(Box, {
        padding: 4,
        children: children
    });
/* -------------------------------------------------------------------------------------------------
 * Close Panel
 * -----------------------------------------------------------------------------------------------*/ const Close = ({ label })=>{
    const { onToggle } = usePanel();
    return /*#__PURE__*/ jsx(IconButton, {
        onClick: onToggle,
        variant: "ghost",
        label: label || 'Close',
        children: /*#__PURE__*/ jsx(Cross, {})
    });
};
const Panel = {
    Root,
    Header,
    Body,
    Footer,
    Close
};
const usePanel = ()=>useContext(PanelContext);

export { Panel, usePanel };
//# sourceMappingURL=FloatingPanel.mjs.map
