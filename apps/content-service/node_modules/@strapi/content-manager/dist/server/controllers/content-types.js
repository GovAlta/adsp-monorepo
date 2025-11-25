'use strict';

var fp = require('lodash/fp');
var index$1 = require('../utils/index.js');
var index = require('./validation/index.js');
var modelConfiguration = require('./validation/model-configuration.js');

const hasEditMainField = fp.has('edit.mainField');
const getEditMainField = fp.prop('edit.mainField');
const assocListMainField = fp.assoc('list.mainField');
const assocMainField = (metadata)=>hasEditMainField(metadata) ? assocListMainField(getEditMainField(metadata), metadata) : metadata;
var contentTypes = {
    async findContentTypes (ctx) {
        const { kind } = ctx.query;
        try {
            await index.validateKind(kind);
        } catch (error) {
            return ctx.send({
                error
            }, 400);
        }
        const contentTypes = index$1.getService('content-types').findContentTypesByKind(kind);
        const { toDto } = index$1.getService('data-mapper');
        ctx.body = {
            data: contentTypes.map(toDto)
        };
    },
    async findContentTypesSettings (ctx) {
        const { findAllContentTypes, findConfiguration } = index$1.getService('content-types');
        const contentTypes = await findAllContentTypes();
        const configurations = await Promise.all(contentTypes.map(async (contentType)=>{
            const { uid, settings } = await findConfiguration(contentType);
            return {
                uid,
                settings
            };
        }));
        ctx.body = {
            data: configurations
        };
    },
    async findContentTypeConfiguration (ctx) {
        const { uid } = ctx.params;
        const contentTypeService = index$1.getService('content-types');
        const contentType = await contentTypeService.findContentType(uid);
        if (!contentType) {
            return ctx.notFound('contentType.notFound');
        }
        const configuration = await contentTypeService.findConfiguration(contentType);
        const confWithUpdatedMetadata = {
            ...configuration,
            metadatas: {
                ...fp.mapValues(assocMainField, configuration.metadatas),
                documentId: {
                    edit: {},
                    list: {
                        label: 'documentId',
                        searchable: true,
                        sortable: true
                    }
                }
            }
        };
        const components = await contentTypeService.findComponentsConfigurations(contentType);
        ctx.body = {
            data: {
                contentType: confWithUpdatedMetadata,
                components
            }
        };
    },
    async updateContentTypeConfiguration (ctx) {
        const { userAbility } = ctx.state;
        const { uid } = ctx.params;
        const { body } = ctx.request;
        const contentTypeService = index$1.getService('content-types');
        const metricsService = index$1.getService('metrics');
        const contentType = await contentTypeService.findContentType(uid);
        if (!contentType) {
            return ctx.notFound('contentType.notFound');
        }
        if (!index$1.getService('permission').canConfigureContentType({
            userAbility,
            contentType
        })) {
            return ctx.forbidden();
        }
        let input;
        try {
            input = await modelConfiguration(contentType).validate(body, {
                abortEarly: false,
                stripUnknown: true,
                strict: true
            });
        } catch (error) {
            return ctx.badRequest(null, {
                name: 'validationError',
                errors: error.errors
            });
        }
        const newConfiguration = await contentTypeService.updateConfiguration(contentType, input);
        await metricsService.sendDidConfigureListView(contentType, newConfiguration);
        const confWithUpdatedMetadata = {
            ...newConfiguration,
            metadatas: fp.mapValues(assocMainField, newConfiguration.metadatas)
        };
        const components = await contentTypeService.findComponentsConfigurations(contentType);
        ctx.body = {
            data: {
                contentType: confWithUpdatedMetadata,
                components
            }
        };
    }
};

module.exports = contentTypes;
//# sourceMappingURL=content-types.js.map
