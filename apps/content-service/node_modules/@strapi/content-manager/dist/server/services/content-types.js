'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var index = require('../utils/index.js');
var store = require('./utils/store.js');
var configuration = require('./configuration.js');

const configurationService = configuration({
    storeUtils: store,
    prefix: 'content_types',
    getModels () {
        const { toContentManagerModel } = index.getService('data-mapper');
        return fp.mapValues(toContentManagerModel, strapi.contentTypes);
    }
});
const service = ({ strapi: strapi1 })=>({
        findAllContentTypes () {
            const { toContentManagerModel } = index.getService('data-mapper');
            return Object.values(strapi1.contentTypes).map(toContentManagerModel);
        },
        findContentType (uid) {
            const { toContentManagerModel } = index.getService('data-mapper');
            const contentType = strapi1.contentTypes[uid];
            return fp.isNil(contentType) ? contentType : toContentManagerModel(contentType);
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
            return this.findAllContentTypes().filter(strapiUtils.contentTypes.isKind(kind));
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
            return index.getService('components').findComponentsConfigurations(contentType);
        },
        syncConfigurations () {
            return configurationService.syncConfigurations();
        }
    });

module.exports = service;
//# sourceMappingURL=content-types.js.map
