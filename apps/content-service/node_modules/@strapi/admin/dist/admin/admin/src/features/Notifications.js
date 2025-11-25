'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var theme = require('../constants/theme.js');

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

const NotificationsContext = /*#__PURE__*/ React__namespace.createContext({
    toggleNotification: ()=>{}
});
/**
 * @internal
 * @description DO NOT USE. This will be removed before stable release of v5.
 */ const NotificationsProvider = ({ children })=>{
    const notificationIdRef = React__namespace.useRef(0);
    const [notifications, setNotifications] = React__namespace.useState([]);
    const toggleNotification = React__namespace.useCallback(({ type, message, link, timeout, blockTransition, onClose, title })=>{
        setNotifications((s)=>[
                ...s,
                {
                    id: notificationIdRef.current++,
                    type,
                    message,
                    link,
                    timeout,
                    blockTransition,
                    onClose,
                    title
                }
            ]);
    }, []);
    const clearNotification = React__namespace.useCallback((id)=>{
        setNotifications((s)=>s.filter((n)=>n.id !== id));
    }, []);
    const value = React__namespace.useMemo(()=>({
            toggleNotification
        }), [
        toggleNotification
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(NotificationsContext.Provider, {
        value: value,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                left: "50%",
                transform: "translateX(-50%)",
                position: "fixed",
                direction: "column",
                alignItems: "stretch",
                gap: 4,
                marginTop: 4,
                top: theme.HEIGHT_TOP_NAVIGATION,
                width: "100%",
                maxWidth: `50rem`,
                zIndex: "notification",
                children: notifications.map((notification)=>{
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingLeft: 4,
                        paddingRight: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(Notification, {
                            ...notification,
                            clearNotification: clearNotification
                        })
                    }, notification.id);
                })
            }),
            children
        ]
    });
};
const Notification = ({ clearNotification, blockTransition = false, id, link, message, onClose, timeout = 2500, title, type })=>{
    const { formatMessage } = reactIntl.useIntl();
    /**
   * Chances are `onClose` won't be classed as stabilised,
   * so we use `useCallbackRef` to avoid make it stable.
   */ const onCloseCallback = designSystem.useCallbackRef(onClose);
    const handleClose = React__namespace.useCallback(()=>{
        onCloseCallback();
        clearNotification(id);
    }, [
        clearNotification,
        id,
        onCloseCallback
    ]);
    // eslint-disable-next-line consistent-return
    React__namespace.useEffect(()=>{
        if (!blockTransition) {
            const timeoutReference = setTimeout(()=>{
                handleClose();
            }, timeout);
            return ()=>{
                clearTimeout(timeoutReference);
            };
        }
    }, [
        blockTransition,
        handleClose,
        timeout
    ]);
    const getVariant = ()=>{
        switch(type){
            case 'info':
                return 'default';
            case 'danger':
                return 'danger';
            case 'warning':
                return 'warning';
            default:
                return 'success';
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Alert, {
        action: link ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
            href: link.url,
            isExternal: true,
            children: link.label
        }) : undefined,
        onClose: handleClose,
        closeLabel: formatMessage({
            id: 'global.close',
            defaultMessage: 'Close'
        }),
        title: title,
        variant: getVariant(),
        children: message
    });
};
/* -------------------------------------------------------------------------------------------------
 * Hook
 * -----------------------------------------------------------------------------------------------*/ /**
 * @preserve
 * @description Returns an object to interact with the notification
 * system. The callbacks are wrapped in `useCallback` for a stable
 * identity.
 *
 * @example
 * ```tsx
 * import { useNotification } from '@strapi/strapi/admin';
 *
 * const MyComponent = () => {
 *  const { toggleNotification } = useNotification();
 *
 *  return <button onClick={() => toggleNotification({ message: 'Hello world!' })}>Click me</button>;
 */ const useNotification = ()=>React__namespace.useContext(NotificationsContext);

exports.NotificationsProvider = NotificationsProvider;
exports.useNotification = useNotification;
//# sourceMappingURL=Notifications.js.map
