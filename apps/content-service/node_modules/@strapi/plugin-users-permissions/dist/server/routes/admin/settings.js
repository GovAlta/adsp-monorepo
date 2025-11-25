'use strict';

var settings;
var hasRequiredSettings;
function requireSettings() {
    if (hasRequiredSettings) return settings;
    hasRequiredSettings = 1;
    settings = [
        {
            method: 'GET',
            path: '/email-templates',
            handler: 'settings.getEmailTemplate',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.email-templates.read'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'PUT',
            path: '/email-templates',
            handler: 'settings.updateEmailTemplate',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.email-templates.update'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'GET',
            path: '/advanced',
            handler: 'settings.getAdvancedSettings',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.advanced-settings.read'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'PUT',
            path: '/advanced',
            handler: 'settings.updateAdvancedSettings',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.advanced-settings.update'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'GET',
            path: '/providers',
            handler: 'settings.getProviders',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.providers.read'
                            ]
                        }
                    }
                ]
            }
        },
        {
            method: 'PUT',
            path: '/providers',
            handler: 'settings.updateProviders',
            config: {
                policies: [
                    {
                        name: 'admin::hasPermissions',
                        config: {
                            actions: [
                                'plugin::users-permissions.providers.update'
                            ]
                        }
                    }
                ]
            }
        }
    ];
    return settings;
}

exports.__require = requireSettings;
//# sourceMappingURL=settings.js.map
