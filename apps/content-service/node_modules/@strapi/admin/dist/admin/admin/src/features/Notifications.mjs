import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Box, useCallbackRef, Alert, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { HEIGHT_TOP_NAVIGATION } from '../constants/theme.mjs';

const NotificationsContext = /*#__PURE__*/ React.createContext({
    toggleNotification: ()=>{}
});
/**
 * @internal
 * @description DO NOT USE. This will be removed before stable release of v5.
 */ const NotificationsProvider = ({ children })=>{
    const notificationIdRef = React.useRef(0);
    const [notifications, setNotifications] = React.useState([]);
    const toggleNotification = React.useCallback(({ type, message, link, timeout, blockTransition, onClose, title })=>{
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
    const clearNotification = React.useCallback((id)=>{
        setNotifications((s)=>s.filter((n)=>n.id !== id));
    }, []);
    const value = React.useMemo(()=>({
            toggleNotification
        }), [
        toggleNotification
    ]);
    return /*#__PURE__*/ jsxs(NotificationsContext.Provider, {
        value: value,
        children: [
            /*#__PURE__*/ jsx(Flex, {
                left: "50%",
                transform: "translateX(-50%)",
                position: "fixed",
                direction: "column",
                alignItems: "stretch",
                gap: 4,
                marginTop: 4,
                top: HEIGHT_TOP_NAVIGATION,
                width: "100%",
                maxWidth: `50rem`,
                zIndex: "notification",
                children: notifications.map((notification)=>{
                    return /*#__PURE__*/ jsx(Box, {
                        paddingLeft: 4,
                        paddingRight: 4,
                        children: /*#__PURE__*/ jsx(Notification, {
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
    const { formatMessage } = useIntl();
    /**
   * Chances are `onClose` won't be classed as stabilised,
   * so we use `useCallbackRef` to avoid make it stable.
   */ const onCloseCallback = useCallbackRef(onClose);
    const handleClose = React.useCallback(()=>{
        onCloseCallback();
        clearNotification(id);
    }, [
        clearNotification,
        id,
        onCloseCallback
    ]);
    // eslint-disable-next-line consistent-return
    React.useEffect(()=>{
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
    return /*#__PURE__*/ jsx(Alert, {
        action: link ? /*#__PURE__*/ jsx(Link, {
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
 */ const useNotification = ()=>React.useContext(NotificationsContext);

export { NotificationsProvider, useNotification };
//# sourceMappingURL=Notifications.mjs.map
