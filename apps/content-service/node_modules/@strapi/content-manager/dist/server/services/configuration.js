'use strict';

var _ = require('lodash');
var index = require('./utils/configuration/index.js');

var createConfigurationService = (({ isComponent, prefix, storeUtils, getModels })=>{
    const uidToStoreKey = (uid)=>{
        return `${prefix}::${uid}`;
    };
    const getConfiguration = (uid)=>{
        const storeKey = uidToStoreKey(uid);
        return storeUtils.getModelConfiguration(storeKey);
    };
    const setConfiguration = (uid, input)=>{
        const configuration = {
            ...input,
            uid,
            isComponent: isComponent ?? undefined
        };
        const storeKey = uidToStoreKey(uid);
        return storeUtils.setModelConfiguration(storeKey, configuration);
    };
    const deleteConfiguration = (uid)=>{
        const storeKey = uidToStoreKey(uid);
        return storeUtils.deleteKey(storeKey);
    };
    const syncConfigurations = async ()=>{
        const models = getModels();
        const configurations = await storeUtils.findByKey(`plugin_content_manager_configuration_${prefix}`);
        const updateConfiguration = async (uid)=>{
            const conf = configurations.find((conf)=>conf.uid === uid);
            return setConfiguration(uid, await index.syncConfiguration(conf, models[uid]));
        };
        const generateNewConfiguration = async (uid)=>{
            return setConfiguration(uid, await index.createDefaultConfiguration(models[uid]));
        };
        const currentUIDS = Object.keys(models);
        const DBUIDs = configurations.map(({ uid })=>uid);
        const contentTypesToUpdate = _.intersection(currentUIDS, DBUIDs);
        const contentTypesToAdd = _.difference(currentUIDS, DBUIDs);
        const contentTypesToDelete = _.difference(DBUIDs, currentUIDS);
        // delete old schemas
        await Promise.all(contentTypesToDelete.map((uid)=>deleteConfiguration(uid)));
        // create new schemas
        await Promise.all(contentTypesToAdd.map((uid)=>generateNewConfiguration(uid)));
        // update current schemas
        await Promise.all(contentTypesToUpdate.map((uid)=>updateConfiguration(uid)));
    };
    return {
        getConfiguration,
        setConfiguration,
        deleteConfiguration,
        syncConfigurations
    };
});

module.exports = createConfigurationService;
//# sourceMappingURL=configuration.js.map
