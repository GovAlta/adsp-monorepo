/**
 * This is for the redux store in `utils`.
 * The more we adopt it, the bigger it will get – which is okay.
 */
declare const initialState: () => {
    admin_app: {
        language: {
            locale: string;
            localeNames: {
                en: string;
            };
        };
        permissions: {
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
            };
        };
        theme: {
            availableThemes: never[];
            currentTheme: string;
        };
        token: string | null;
    };
};
export { initialState };
