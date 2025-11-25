'use strict';

var providers = require('../../../../../errors/providers.js');
var entity = require('../../../../queries/entity.js');
require('lodash/fp');
require('stream');
require('crypto');
require('events');
require('lodash');
require('@strapi/utils');
var configuration = require('./configuration.js');

const deleteRecords = async (strapi, options)=>{
    const entities = await deleteEntitiesRecords(strapi, options);
    const configuration = await deleteConfigurationRecords(strapi, options);
    return {
        count: entities.count + configuration.count,
        entities,
        configuration
    };
};
const deleteEntitiesRecords = async (strapi, options = {})=>{
    const { entities } = options;
    const models = strapi.get('models').get();
    const contentTypes = Object.values(strapi.contentTypes);
    const contentTypesToClear = contentTypes.filter((contentType)=>{
        let removeThisContentType = true;
        // include means "only include these types" so if it's not in here, it's not being included
        if (entities?.include) {
            removeThisContentType = entities.include.includes(contentType.uid);
        }
        // if something is excluded, remove it. But lack of being excluded doesn't mean it's kept
        if (entities?.exclude && entities.exclude.includes(contentType.uid)) {
            removeThisContentType = false;
        }
        if (entities?.filters) {
            removeThisContentType = entities.filters.every((filter)=>filter(contentType));
        }
        return removeThisContentType;
    }).map((contentType)=>contentType.uid);
    const modelsToClear = models.filter((model)=>{
        if (contentTypesToClear.includes(model.uid)) {
            return false;
        }
        let removeThisModel = true;
        // include means "only include these types" so if it's not in here, it's not being included
        if (entities?.include) {
            removeThisModel = entities.include.includes(model.uid);
        }
        // if something is excluded, remove it. But lack of being excluded doesn't mean it's kept
        if (entities?.exclude && entities.exclude.includes(model.uid)) {
            removeThisModel = false;
        }
        return removeThisModel;
    }).map((model)=>model.uid);
    const [results, updateResults] = useResults([
        ...contentTypesToClear,
        ...modelsToClear
    ]);
    const contentTypeQuery = entity.createEntityQuery(strapi);
    const contentTypePromises = contentTypesToClear.map(async (uid)=>{
        const result = await contentTypeQuery(uid).deleteMany(entities?.params);
        if (result) {
            updateResults(result.count || 0, uid);
        }
    });
    const modelsPromises = modelsToClear.map(async (uid)=>{
        const result = await strapi.db.query(uid).deleteMany({});
        if (result) {
            updateResults(result.count || 0, uid);
        }
    });
    await Promise.all([
        ...contentTypePromises,
        ...modelsPromises
    ]);
    return results;
};
const deleteConfigurationRecords = async (strapi, options = {})=>{
    const { coreStore = true, webhook = true } = options?.configuration ?? {};
    const models = [];
    if (coreStore) {
        models.push('strapi::core-store');
    }
    if (webhook) {
        models.push('strapi::webhook');
    }
    const [results, updateResults] = useResults(models);
    const deletePromises = models.map(async (uid)=>{
        const result = await strapi.db.query(uid).deleteMany({});
        if (result) {
            updateResults(result.count, uid);
        }
    });
    await Promise.all(deletePromises);
    return results;
};
const useResults = (keys)=>{
    const results = {
        count: 0,
        aggregate: keys.reduce((acc, key)=>({
                ...acc,
                [key]: {
                    count: 0
                }
            }), {})
    };
    const update = (count, key)=>{
        if (key) {
            if (!(key in results.aggregate)) {
                throw new providers.ProviderTransferError(`Unknown key "${key}" provided in results update`);
            }
            results.aggregate[key].count += count;
        }
        results.count += count;
    };
    return [
        results,
        update
    ];
};

exports.createConfigurationWriteStream = configuration.createConfigurationWriteStream;
exports.restoreConfigs = configuration.restoreConfigs;
exports.deleteRecords = deleteRecords;
//# sourceMappingURL=index.js.map
