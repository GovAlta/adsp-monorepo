import type { StrapiAppSettingLink } from './core/apis/router';
export declare const ADMIN_PERMISSIONS_CE: {
    contentManager: {
        main: never[];
        collectionTypesConfigurations: {
            action: string;
            subject: null;
        }[];
        componentsConfigurations: {
            action: string;
            subject: null;
        }[];
        singleTypesConfigurations: {
            action: string;
            subject: null;
        }[];
    };
    marketplace: {
        main: {
            action: string;
            subject: null;
        }[];
        read: {
            action: string;
            subject: null;
        }[];
    };
    settings: {
        roles: {
            main: {
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
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        users: {
            main: {
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
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        webhooks: {
            main: {
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
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        'api-tokens': {
            main: {
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
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
            regenerate: {
                action: string;
                subject: null;
            }[];
        };
        'transfer-tokens': {
            main: {
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
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
            regenerate: {
                action: string;
                subject: null;
            }[];
        };
        'project-settings': {
            read: {
                action: string;
                subject: null;
            }[];
            update: {
                action: string;
                subject: null;
            }[];
        };
        plugins: {
            main: {
                action: string;
                subject: null;
            }[];
            read: {
                action: string;
                subject: null;
            }[];
        };
    };
};
export declare const HOOKS: {
    /**
     * Hook that allows to mutate the displayed headers of the list view table
     * @constant
     * @type {string}
     */
    INJECT_COLUMN_IN_TABLE: string;
    /**
     * Hook that allows to mutate the CM's collection types links pre-set filters
     * @constant
     * @type {string}
     */
    MUTATE_COLLECTION_TYPES_LINKS: string;
    /**
     * Hook that allows to mutate the CM's edit view layout
     * @constant
     * @type {string}
     */
    MUTATE_EDIT_VIEW_LAYOUT: string;
    /**
     * Hook that allows to mutate the CM's single types links pre-set filters
     * @constant
     * @type {string}
     */
    MUTATE_SINGLE_TYPES_LINKS: string;
};
export interface SettingsMenuLink extends Omit<StrapiAppSettingLink, 'Component' | 'permissions' | 'licenseOnly'> {
    licenseOnly?: boolean;
}
export type SettingsMenu = {
    admin: SettingsMenuLink[];
    global: SettingsMenuLink[];
};
export declare const SETTINGS_LINKS_CE: () => SettingsMenu;
