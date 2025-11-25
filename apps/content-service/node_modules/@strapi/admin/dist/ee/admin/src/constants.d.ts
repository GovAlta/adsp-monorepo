import type { SettingsMenu } from '../../../admin/src/constants';
import type { RouteObject } from 'react-router-dom';
export declare const ADMIN_PERMISSIONS_EE: {
    settings: {
        auditLogs: {
            main: {
                action: string;
                subject: null;
            }[];
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        'review-workflows': {
            main: {
                action: string;
                subject: null;
            }[];
            read: {
                action: string;
                subject: null;
            }[];
            create: {
                action: string;
                subject: null;
            }[];
            delete: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        sso: {
            main: {
                action: string;
                subject: null;
            }[];
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        releases: {
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
    };
};
/**
 * Base EE routes, these are relative to the `root` of the app.
 * We use a function to get them so we're not looking at window
 * during build time.
 */
export declare const getEERoutes: () => RouteObject[];
export declare const AUDIT_LOGS_DEFAULT_PAGE_SIZE = 50;
export declare const SETTINGS_LINKS_EE: () => SettingsMenu;
