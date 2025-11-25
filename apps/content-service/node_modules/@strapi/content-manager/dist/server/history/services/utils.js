'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var constants = require('../constants.js');

const DEFAULT_RETENTION_DAYS = 90;
const createServiceUtils = ({ strapi })=>{
    /**
   * @description
   * Get the difference between the version schema and the content type schema
   */ const getSchemaAttributesDiff = (versionSchemaAttributes, contentTypeSchemaAttributes)=>{
        // Omit the same fields that were omitted when creating a history version
        const sanitizedContentTypeSchemaAttributes = fp.omit(constants.FIELDS_TO_IGNORE, contentTypeSchemaAttributes);
        const reduceDifferenceToAttributesObject = (diffKeys, source)=>{
            return diffKeys.reduce((previousAttributesObject, diffKey)=>{
                previousAttributesObject[diffKey] = source[diffKey];
                return previousAttributesObject;
            }, {});
        };
        const versionSchemaKeys = Object.keys(versionSchemaAttributes);
        const contentTypeSchemaAttributesKeys = Object.keys(sanitizedContentTypeSchemaAttributes);
        // The attribute is new if it's on the content type schema but not on the version schema
        const uniqueToContentType = fp.difference(contentTypeSchemaAttributesKeys, versionSchemaKeys);
        const added = reduceDifferenceToAttributesObject(uniqueToContentType, sanitizedContentTypeSchemaAttributes);
        // The attribute was removed or renamed if it's on the version schema but not on the content type schema
        const uniqueToVersion = fp.difference(versionSchemaKeys, contentTypeSchemaAttributesKeys);
        const removed = reduceDifferenceToAttributesObject(uniqueToVersion, versionSchemaAttributes);
        return {
            added,
            removed
        };
    };
    /**
   * @description
   * Gets the value to set for a relation when restoring a document
   * @returns
   * The relation if it exists or null
   */ const getRelationRestoreValue = async (versionRelationData, attribute)=>{
        if (Array.isArray(versionRelationData)) {
            if (versionRelationData.length === 0) return versionRelationData;
            const existingAndMissingRelations = await Promise.all(versionRelationData.map((relation)=>{
                return strapi.documents(attribute.target).findOne({
                    documentId: relation.documentId,
                    locale: relation.locale || undefined
                });
            }));
            return existingAndMissingRelations.filter((relation)=>relation !== null);
        }
        return strapi.documents(attribute.target).findOne({
            documentId: versionRelationData.documentId,
            locale: versionRelationData.locale || undefined
        });
    };
    /**
   * @description
   * Gets the value to set for a media asset when restoring a document
   * @returns
   * The media asset if it exists or null
   */ const getMediaRestoreValue = async (versionRelationData)=>{
        if (Array.isArray(versionRelationData)) {
            const existingAndMissingMedias = await Promise.all(versionRelationData.map((media)=>{
                return strapi.db.query('plugin::upload.file').findOne({
                    where: {
                        id: media.id
                    }
                });
            }));
            return existingAndMissingMedias.filter((media)=>media != null);
        }
        return strapi.db.query('plugin::upload.file').findOne({
            where: {
                id: versionRelationData.id
            }
        });
    };
    const localesService = strapi.plugin('i18n')?.service('locales');
    const i18nContentTypeService = strapi.plugin('i18n')?.service('content-types');
    const getDefaultLocale = async ()=>localesService ? localesService.getDefaultLocale() : null;
    const isLocalizedContentType = (model)=>i18nContentTypeService ? i18nContentTypeService.isLocalizedContentType(model) : false;
    /**
   *
   * @description
   * Creates a dictionary of all locales available
   */ const getLocaleDictionary = async ()=>{
        if (!localesService) return {};
        const locales = await localesService.find() || [];
        return locales.reduce((acc, locale)=>{
            acc[locale.code] = {
                name: locale.name,
                code: locale.code
            };
            return acc;
        }, {});
    };
    /**
   *
   * @description
   * Gets the number of retention days defined on the license or configured by the user
   */ const getRetentionDays = ()=>{
        const featureConfig = strapi.ee.features.get('cms-content-history');
        const licenseRetentionDays = typeof featureConfig === 'object' && featureConfig?.options.retentionDays;
        const userRetentionDays = strapi.config.get('admin.history.retentionDays');
        // Allow users to override the license retention days, but not to increase it
        if (userRetentionDays && userRetentionDays < licenseRetentionDays) {
            return userRetentionDays;
        }
        // User didn't provide retention days value, use the license or fallback to default
        return Math.min(licenseRetentionDays, DEFAULT_RETENTION_DAYS);
    };
    const getVersionStatus = async (contentTypeUid, document)=>{
        const documentMetadataService = strapi.plugin('content-manager').service('document-metadata');
        const meta = await documentMetadataService.getMetadata(contentTypeUid, document);
        return documentMetadataService.getStatus(document, meta.availableStatus);
    };
    /**
   * Lists all the fields of a component, excepts those that will be populated.
   * The goal is to exclude the ID, because when restoring a component,
   * referencing an ID for a component db row that was deleted creates an error.
   * So we never store component IDs to ensure they're re-created while restoring a version.
   */ const getComponentFields = (componentUID)=>{
        return Object.entries(strapi.getModel(componentUID).attributes).reduce((fieldsAcc, [key, attribute])=>{
            if (![
                'relation',
                'media',
                'component',
                'dynamiczone'
            ].includes(attribute.type)) {
                fieldsAcc.push(key);
            }
            return fieldsAcc;
        }, []);
    };
    /**
   * @description
   * Creates a populate object that looks for all the relations that need
   * to be saved in history, and populates only the fields needed to later retrieve the content.
   *
   * @param uid - The content type UID
   * @param useDatabaseSyntax - Whether to use the database syntax for populate, defaults to false
   */ const getDeepPopulate = (uid, useDatabaseSyntax = false)=>{
        const model = strapi.getModel(uid);
        const attributes = Object.entries(model.attributes);
        const fieldSelector = useDatabaseSyntax ? 'select' : 'fields';
        return attributes.reduce((acc, [attributeName, attribute])=>{
            switch(attribute.type){
                case 'relation':
                    {
                        // TODO: Support polymorphic relations
                        const isMorphRelation = attribute.relation.toLowerCase().startsWith('morph');
                        if (isMorphRelation) {
                            break;
                        }
                        const isVisible = strapiUtils.contentTypes.isVisibleAttribute(model, attributeName);
                        if (isVisible) {
                            acc[attributeName] = {
                                [fieldSelector]: [
                                    'documentId',
                                    'locale',
                                    'publishedAt'
                                ]
                            };
                        }
                        break;
                    }
                case 'media':
                    {
                        acc[attributeName] = {
                            [fieldSelector]: [
                                'id'
                            ]
                        };
                        break;
                    }
                case 'component':
                    {
                        const populate = getDeepPopulate(attribute.component);
                        acc[attributeName] = {
                            populate,
                            [fieldSelector]: getComponentFields(attribute.component)
                        };
                        break;
                    }
                case 'dynamiczone':
                    {
                        // Use fragments to populate the dynamic zone components
                        const populatedComponents = (attribute.components || []).reduce((acc, componentUID)=>{
                            acc[componentUID] = {
                                populate: getDeepPopulate(componentUID),
                                [fieldSelector]: getComponentFields(componentUID)
                            };
                            return acc;
                        }, {});
                        acc[attributeName] = {
                            on: populatedComponents
                        };
                        break;
                    }
            }
            return acc;
        }, {});
    };
    /**
   * @description
   * Builds a response object for relations containing the related data and a count of missing relations
   */ const buildMediaResponse = async (values)=>{
        return values// Until we implement proper pagination, limit relations to an arbitrary amount
        .slice(0, 25).reduce(async (currentRelationDataPromise, entry)=>{
            const currentRelationData = await currentRelationDataPromise;
            // Entry can be null if it's a toOne relation
            if (!entry) {
                return currentRelationData;
            }
            const relatedEntry = await strapi.db.query('plugin::upload.file').findOne({
                where: {
                    id: entry.id
                }
            });
            if (relatedEntry) {
                currentRelationData.results.push(relatedEntry);
            } else {
                // The related content has been deleted
                currentRelationData.meta.missingCount += 1;
            }
            return currentRelationData;
        }, Promise.resolve({
            results: [],
            meta: {
                missingCount: 0
            }
        }));
    };
    /**
   * @description
   * Builds a response object for media containing the media assets data and a count of missing media assets
   */ const buildRelationReponse = async (values, attributeSchema)=>{
        return values// Until we implement proper pagination, limit relations to an arbitrary amount
        .slice(0, 25).reduce(async (currentRelationDataPromise, entry)=>{
            const currentRelationData = await currentRelationDataPromise;
            // Entry can be null if it's a toOne relation
            if (!entry) {
                return currentRelationData;
            }
            const relatedEntry = await strapi.documents(attributeSchema.target).findOne({
                documentId: entry.documentId,
                locale: entry.locale || undefined
            });
            if (relatedEntry) {
                currentRelationData.results.push({
                    ...relatedEntry,
                    status: await getVersionStatus(attributeSchema.target, relatedEntry)
                });
            } else {
                // The related content has been deleted
                currentRelationData.meta.missingCount += 1;
            }
            return currentRelationData;
        }, Promise.resolve({
            results: [],
            meta: {
                missingCount: 0
            }
        }));
    };
    return {
        getSchemaAttributesDiff,
        getRelationRestoreValue,
        getMediaRestoreValue,
        getDefaultLocale,
        isLocalizedContentType,
        getLocaleDictionary,
        getRetentionDays,
        getVersionStatus,
        getDeepPopulate,
        buildMediaResponse,
        buildRelationReponse
    };
};

exports.createServiceUtils = createServiceUtils;
//# sourceMappingURL=utils.js.map
