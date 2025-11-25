'use strict';

const FORM_INITIAL_VALUES = {
    ...window.strapi.features.isEnabled(window.strapi.features.SSO) ? {
        useSSORegistration: true
    } : {}
};
const ROLE_LAYOUT = [
    ...window.strapi.features.isEnabled(window.strapi.features.SSO) ? [
        [
            {
                label: {
                    id: 'Settings.permissions.users.form.sso',
                    defaultMessage: 'Connect with SSO'
                },
                name: 'useSSORegistration',
                type: 'boolean',
                size: 6
            }
        ]
    ] : []
];

exports.FORM_INITIAL_VALUES = FORM_INITIAL_VALUES;
exports.ROLE_LAYOUT = ROLE_LAYOUT;
//# sourceMappingURL=ModalForm.js.map
