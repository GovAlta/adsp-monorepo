import _ from 'lodash';
import { errors, file } from '@strapi/utils';
import registerUploadMiddleware from './middlewares/upload.mjs';
import spec from './documentation/content-api.json.mjs';

const { PayloadTooLargeError } = errors;
const { bytesToHumanReadable, kbytesToBytes } = file;
/**
 * Register upload plugin
 */ async function register({ strapi }) {
    strapi.plugin('upload').provider = createProvider(strapi.config.get('plugin::upload'));
    await registerUploadMiddleware({
        strapi
    });
    if (strapi.plugin('graphql')) {
        const { installGraphqlExtension } = await import('./graphql.mjs');
        installGraphqlExtension({
            strapi
        });
    }
    if (strapi.plugin('documentation')) {
        strapi.plugin('documentation').service('override').registerOverride(spec, {
            pluginOrigin: 'upload',
            excludeFromGeneration: [
                'upload'
            ]
        });
    }
}
const createProvider = (config)=>{
    const { providerOptions, actionOptions = {} } = config;
    const providerName = _.toLower(config.provider);
    let provider;
    let modulePath;
    try {
        modulePath = require.resolve(`@strapi/provider-upload-${providerName}`);
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
            modulePath = providerName;
        } else {
            throw error;
        }
    }
    try {
        provider = require(modulePath);
    } catch (err) {
        const newError = new Error(`Could not load upload provider "${providerName}".`);
        if (err instanceof Error) {
            newError.stack = err.stack;
        }
        throw newError;
    }
    const providerInstance = provider.init(providerOptions);
    if (!providerInstance.delete) {
        throw new Error(`The upload provider "${providerName}" doesn't implement the delete method.`);
    }
    if (!providerInstance.upload && !providerInstance.uploadStream) {
        throw new Error(`The upload provider "${providerName}" doesn't implement the uploadStream nor the upload method.`);
    }
    if (!providerInstance.uploadStream) {
        process.emitWarning(`The upload provider "${providerName}" doesn't implement the uploadStream function. Strapi will fallback on the upload method. Some performance issues may occur.`);
    }
    const wrappedProvider = _.mapValues(providerInstance, (method, methodName)=>{
        return async (file, options = actionOptions[methodName])=>providerInstance[methodName](file, options);
    });
    return Object.assign(Object.create(baseProvider), wrappedProvider);
};
const baseProvider = {
    extend (obj) {
        Object.assign(this, obj);
    },
    checkFileSize (file, { sizeLimit }) {
        if (sizeLimit && kbytesToBytes(file.size) > sizeLimit) {
            throw new PayloadTooLargeError(`${file.originalFilename} exceeds size limit of ${bytesToHumanReadable(sizeLimit)}.`);
        }
    },
    getSignedUrl (file) {
        return file;
    },
    isPrivate () {
        return false;
    }
};

export { register };
//# sourceMappingURL=register.mjs.map
