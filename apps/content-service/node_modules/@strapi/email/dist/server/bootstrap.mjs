const createProvider = (emailConfig)=>{
    const providerName = emailConfig.provider.toLowerCase();
    let provider;
    let modulePath;
    try {
        modulePath = require.resolve(`@strapi/provider-email-${providerName}`);
    } catch (error) {
        if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
            modulePath = providerName;
        } else {
            throw error;
        }
    }
    try {
        provider = require(modulePath);
    } catch (err) {
        throw new Error(`Could not load email provider "${providerName}".`);
    }
    return provider.init(emailConfig.providerOptions, emailConfig.settings);
};
const bootstrap = async ({ strapi })=>{
    const emailConfig = strapi.config.get('plugin::email');
    strapi.plugin('email').provider = createProvider(emailConfig);
    // Add permissions
    const actions = [
        {
            section: 'settings',
            category: 'email',
            displayName: 'Access the Email Settings page',
            uid: 'settings.read',
            pluginName: 'email'
        }
    ];
    await strapi.service('admin::permission').actionProvider.registerMany(actions);
};

export { bootstrap };
//# sourceMappingURL=bootstrap.mjs.map
