import { isNil, mapValues } from 'lodash/fp';
import { contentTypes } from '@strapi/utils';
import { getService } from '../utils/index.mjs';
import storeUtils from './utils/store.mjs';
import createConfigurationService from './configuration.mjs';

const configurationService = createConfigurationService({
    storeUtils,
    prefix: 'content_types',
    getModels () {
        const { toContentManagerModel } = getService('data-mapper');
        return mapValues(toContentManagerModel, strapi.contentTypes);
    }
});
const service = ({ strapi: strapi1 })=>({
        findAllContentTypes () {
            const { toContentManagerModel } = getService('data-mapper');
            return Object.values(strapi1.contentTypes).map(toContentManagerModel);
        },
        findContentType (uid) {
            const { toContentManagerModel } = getService('data-mapper');
            const contentType = strapi1.contentTypes[uid];
            return isNil(contentType) ? contentType : toContentManagerModel(contentType);
        },
        findDisplayedContentTypes () {
            return this.findAllContentTypes().filter(// TODO
            // @ts-expect-error should be resolved from data-mapper types
            ({ isDisplayed })=>isDisplayed === true);
        },
        findContentTypesByKind (kind) {
            if (!kind) {
                return this.findAllContentTypes();
            }
            // @ts-expect-error TODO when adding types
            return this.findAllContentTypes().filter(contentTypes.isKind(kind));
        },
        async findConfiguration (contentType) {
            const configuration = await configurationService.getConfiguration(contentType.uid);
            return {
                uid: contentType.uid,
                ...configuration
            };
        },
        async updateConfiguration (contentType, newConfiguration) {
            await configurationService.setConfiguration(contentType.uid, newConfiguration);
            return this.findConfiguration(contentType);
        },
        findComponentsConfigurations (contentType) {
            // delegate to componentService
            return getService('components').findComponentsConfigurations(contentType);
        },
        syncConfigurations () {
            return configurationService.syncConfigurations();
        }
    });

export { service as default };
//# sourceMappingURL=content-types.mjs.map
