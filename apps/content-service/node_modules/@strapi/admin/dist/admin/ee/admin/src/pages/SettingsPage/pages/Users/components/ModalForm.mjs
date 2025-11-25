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

export { FORM_INITIAL_VALUES, ROLE_LAYOUT };
//# sourceMappingURL=ModalForm.mjs.map
