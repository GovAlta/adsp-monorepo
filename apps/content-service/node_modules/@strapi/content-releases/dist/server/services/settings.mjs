const DEFAULT_SETTINGS = {
    defaultTimezone: null
};
const createSettingsService = ({ strapi })=>{
    const getStore = async ()=>strapi.store({
            type: 'core',
            name: 'content-releases'
        });
    return {
        async update ({ settings }) {
            const store = await getStore();
            store.set({
                key: 'settings',
                value: settings
            });
            return settings;
        },
        async find () {
            const store = await getStore();
            const settings = await store.get({
                key: 'settings'
            });
            return {
                ...DEFAULT_SETTINGS,
                ...settings || {}
            };
        }
    };
};

export { createSettingsService as default };
//# sourceMappingURL=settings.mjs.map
