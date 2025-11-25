const getProviderName = ()=>strapi.config.get('plugin::upload.provider', 'local');
const isProviderPrivate = async ()=>strapi.plugin('upload').provider.isPrivate();
var metrics = (({ strapi: strapi1 })=>({
        async sendUploadPluginMetrics () {
            const uploadProvider = getProviderName();
            const privateProvider = await isProviderPrivate();
            strapi1.telemetry.send('didInitializePluginUpload', {
                groupProperties: {
                    uploadProvider,
                    privateProvider
                }
            });
        }
    }));

export { metrics as default };
//# sourceMappingURL=metrics.mjs.map
