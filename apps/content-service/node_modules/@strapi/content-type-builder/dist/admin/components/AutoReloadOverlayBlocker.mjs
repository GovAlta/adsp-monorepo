import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, Typography, Link } from '@strapi/design-system';
import { ArrowClockwise, Clock } from '@strapi/icons';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import { keyframes, styled } from 'styled-components';

const AutoReloadOverlayBlockerContext = /*#__PURE__*/ React.createContext({
    lockAppWithAutoreload: ()=>{},
    unlockAppWithAutoreload: ()=>{}
});
const MAX_ELAPSED_TIME = 300 * 1000;
const AutoReloadOverlayBlockerProvider = ({ children })=>{
    const [isOpen, setIsOpen] = React.useState(false);
    const [config, setConfig] = React.useState({});
    const [failed, setFailed] = React.useState(false);
    const lockAppWithAutoreload = React.useCallback((config = {})=>{
        setIsOpen(true);
        setConfig(config);
    }, []);
    const unlockAppWithAutoreload = React.useCallback(()=>{
        setIsOpen(false);
        setConfig({});
    }, []);
    // eslint-disable-next-line consistent-return
    React.useEffect(()=>{
        if (isOpen) {
            const timeout = setTimeout(()=>{
                setFailed(true);
            }, MAX_ELAPSED_TIME);
            return ()=>{
                clearTimeout(timeout);
            };
        }
    }, [
        isOpen
    ]);
    let displayedIcon = config?.icon || 'reload';
    let description = {
        id: config?.description || 'components.OverlayBlocker.description',
        defaultMessage: "You're using a feature that needs the server to restart. The page will reload automatically."
    };
    let title = {
        id: config?.title || 'components.OverlayBlocker.title',
        defaultMessage: 'Waiting for restart'
    };
    if (failed) {
        displayedIcon = 'time';
        description = {
            id: 'components.OverlayBlocker.description.serverError',
            defaultMessage: 'The server should have restarted, please check your logs in the terminal.'
        };
        title = {
            id: 'components.OverlayBlocker.title.serverError',
            defaultMessage: 'The restart is taking longer than expected'
        };
    }
    const autoReloadValue = React.useMemo(()=>({
            lockAppWithAutoreload,
            unlockAppWithAutoreload
        }), [
        lockAppWithAutoreload,
        unlockAppWithAutoreload
    ]);
    return /*#__PURE__*/ jsxs(AutoReloadOverlayBlockerContext.Provider, {
        value: autoReloadValue,
        children: [
            /*#__PURE__*/ jsx(Blocker, {
                displayedIcon: displayedIcon,
                isOpen: isOpen,
                description: description,
                title: title
            }),
            children
        ]
    });
};
const Blocker = ({ displayedIcon, description, title, isOpen })=>{
    const { formatMessage } = useIntl();
    // eslint-disable-next-line no-undef
    return isOpen && globalThis?.document?.body ? /*#__PURE__*/ createPortal(/*#__PURE__*/ jsxs(Overlay, {
        id: "autoReloadOverlayBlocker",
        direction: "column",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "center",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "h1",
                        variant: "alpha",
                        children: formatMessage(title)
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "h2",
                        textColor: "neutral600",
                        fontSize: 4,
                        fontWeight: "regular",
                        children: formatMessage(description)
                    })
                ]
            }),
            displayedIcon === 'reload' && /*#__PURE__*/ jsx(IconBox, {
                padding: 6,
                background: "primary100",
                borderColor: "primary200",
                children: /*#__PURE__*/ jsx(LoaderReload, {
                    width: "4rem",
                    height: "4rem"
                })
            }),
            displayedIcon === 'time' && /*#__PURE__*/ jsx(IconBox, {
                padding: 6,
                background: "primary100",
                borderColor: "primary200",
                children: /*#__PURE__*/ jsx(Clock, {
                    width: "4rem",
                    height: "4rem"
                })
            }),
            /*#__PURE__*/ jsx(Box, {
                marginTop: 2,
                children: /*#__PURE__*/ jsx(Link, {
                    href: "https://docs.strapi.io",
                    isExternal: true,
                    children: formatMessage({
                        id: 'global.documentation',
                        defaultMessage: 'Read the documentation'
                    })
                })
            })
        ]
    }), // eslint-disable-next-line no-undef
    globalThis.document.body) : null;
};
const rotation = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(359deg);
    }
  `;
const LoaderReload = styled(ArrowClockwise)`
  animation: ${rotation} 1s infinite linear;
`;
const Overlay = styled(Flex)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  /* TODO: set this up in the theme for consistence z-index values */
  z-index: 1140;
  padding-top: 16rem;

  & > * {
    position: relative;
    z-index: 1;
  }

  &:before {
    content: '';
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: ${({ theme })=>theme.colors.neutral0};
    opacity: 0.9;
  }
`;
const IconBox = styled(Box)`
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    > path {
      fill: ${({ theme })=>theme.colors.primary600} !important;
    }
  }
`;
/* -------------------------------------------------------------------------------------------------
 * Hook
 * -----------------------------------------------------------------------------------------------*/ const useAutoReloadOverlayBlocker = ()=>React.useContext(AutoReloadOverlayBlockerContext);

export { AutoReloadOverlayBlockerProvider, useAutoReloadOverlayBlocker };
//# sourceMappingURL=AutoReloadOverlayBlocker.mjs.map
