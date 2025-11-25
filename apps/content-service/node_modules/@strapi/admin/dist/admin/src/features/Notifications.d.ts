import * as React from 'react';
interface NotificationLink {
    label: string;
    target?: string;
    url: string;
}
interface NotificationConfig {
    blockTransition?: boolean;
    link?: NotificationLink;
    message?: string;
    onClose?: () => void;
    timeout?: number;
    title?: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
}
interface NotificationsContextValue {
    /**
     * Toggles a notification, wrapped in `useCallback` for a stable identity.
     */
    toggleNotification: (config: NotificationConfig) => void;
}
interface NotificationsProviderProps {
    children: React.ReactNode;
}
/**
 * @internal
 * @description DO NOT USE. This will be removed before stable release of v5.
 */
declare const NotificationsProvider: ({ children }: NotificationsProviderProps) => import("react/jsx-runtime").JSX.Element;
/**
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
 */
declare const useNotification: () => NotificationsContextValue;
export { NotificationsProvider, useNotification };
export type { NotificationConfig, NotificationsContextValue };
