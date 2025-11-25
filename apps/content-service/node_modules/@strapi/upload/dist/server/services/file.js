'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var constants = require('../constants.js');
var index = require('../utils/index.js');

const getFolderPath = async (folderId)=>{
    if (!folderId) return '/';
    const parentFolder = await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
        where: {
            id: folderId
        }
    });
    return parentFolder.path;
};
const deleteByIds = async (ids = [])=>{
    const filesToDelete = await strapi.db.query(constants.FILE_MODEL_UID).findMany({
        where: {
            id: {
                $in: ids
            }
        }
    });
    await Promise.all(filesToDelete.map((file)=>index.getService('upload').remove(file)));
    return filesToDelete;
};
const signFileUrls = async (file)=>{
    const { provider } = strapi.plugins.upload;
    const { provider: providerConfig } = strapi.config.get('plugin::upload');
    const isPrivate = await provider.isPrivate();
    file.isUrlSigned = false;
    // Check file provider and if provider is private
    if (file.provider !== providerConfig || !isPrivate) {
        return file;
    }
    const signUrl = async (file)=>{
        const signedUrl = await provider.getSignedUrl(file);
        file.url = signedUrl.url;
        file.isUrlSigned = true;
    };
    const signedFile = fp.cloneDeep(file);
    // Sign each file format
    await signUrl(signedFile);
    if (file.formats) {
        await utils.async.map(Object.values(signedFile.formats ?? {}), signUrl);
    }
    return signedFile;
};
var file = {
    getFolderPath,
    deleteByIds,
    signFileUrls
};

module.exports = file;
//# sourceMappingURL=file.js.map
