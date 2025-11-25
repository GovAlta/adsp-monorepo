'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactDom = require('react-dom');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const AutoReloadOverlayBlockerContext = /*#__PURE__*/ React__namespace.createContext({
    lockAppWithAutoreload: ()=>{},
    unlockAppWithAutoreload: ()=>{}
});
const MAX_ELAPSED_TIME = 300 * 1000;
const AutoReloadOverlayBlockerProvider = ({ children })=>{
    const [isOpen, setIsOpen] = React__namespace.useState(false);
    const [config, setConfig] = React__namespace.useState({});
    const [failed, setFailed] = React__namespace.useState(false);
    const lockAppWithAutoreload = React__namespace.useCallback((config = {})=>{
        setIsOpen(true);
        setConfig(config);
    }, []);
    const unlockAppWithAutoreload = React__namespace.useCallback(()=>{
        setIsOpen(false);
        setConfig({});
    }, []);
    // eslint-disable-next-line consistent-return
    React__namespace.useEffect(()=>{
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
    const autoReloadValue = React__namespace.useMemo(()=>({
            lockAppWithAutoreload,
            unlockAppWithAutoreload
        }), [
        lockAppWithAutoreload,
        unlockAppWithAutoreload
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(AutoReloadOverlayBlockerContext.Provider, {
        value: autoReloadValue,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Blocker, {
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
    const { formatMessage } = reactIntl.useIntl();
    // eslint-disable-next-line no-undef
    return isOpen && globalThis?.document?.body ? /*#__PURE__*/ reactDom.createPortal(/*#__PURE__*/ jsxRuntime.jsxs(Overlay, {
        id: "autoReloadOverlayBlocker",
        direction: "column",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "center",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "h1",
                        variant: "alpha",
                        children: formatMessage(title)
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "h2",
                        textColor: "neutral600",
                        fontSize: 4,
                        fontWeight: "regular",
                        children: formatMessage(description)
                    })
                ]
            }),
            displayedIcon === 'reload' && /*#__PURE__*/ jsxRuntime.jsx(IconBox, {
                padding: 6,
                background: "primary100",
                borderColor: "primary200",
                children: /*#__PURE__*/ jsxRuntime.jsx(LoaderReload, {
                    width: "4rem",
                    height: "4rem"
                })
            }),
            displayedIcon === 'time' && /*#__PURE__*/ jsxRuntime.jsx(IconBox, {
                padding: 6,
                background: "primary100",
                borderColor: "primary200",
                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Clock, {
                    width: "4rem",
                    height: "4rem"
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginTop: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
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
const rotation = styledComponents.keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(359deg);
    }
  `;
const LoaderReload = styledComponents.styled(Icons.ArrowClockwise)`
  animation: ${rotation} 1s infinite linear;
`;
const Overlay = styledComponents.styled(designSystem.Flex)`
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
const IconBox = styledComponents.styled(designSystem.Box)`
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
 * -----------------------------------------------------------------------------------------------*/ const useAutoReloadOverlayBlocker = ()=>React__namespace.useContext(AutoReloadOverlayBlockerContext);

exports.AutoReloadOverlayBlockerProvider = AutoReloadOverlayBlockerProvider;
exports.useAutoReloadOverlayBlocker = useAutoReloadOverlayBlocker;
//# sourceMappingURL=AutoReloadOverlayBlocker.js.map
