'use strict';

var fp = require('lodash/fp');
var index = require('../utils/index.js');
var constants = require('../constants.js');

const getStore = ()=>strapi.store({
        type: 'plugin',
        name: 'upload',
        key: 'api-folder'
    });
const createApiUploadFolder = async ()=>{
    let name = constants.API_UPLOAD_FOLDER_BASE_NAME;
    const folderService = index.getService('folder');
    let exists = true;
    let index$1 = 1;
    while(exists){
        exists = await folderService.exists({
            name,
            parent: null
        });
        if (exists) {
            name = `${constants.API_UPLOAD_FOLDER_BASE_NAME} (${index$1})`;
            index$1 += 1;
        }
    }
    const folder = await folderService.create({
        name
    });
    await getStore().set({
        value: {
            id: folder.id
        }
    });
    return folder;
};
const getAPIUploadFolder = async ()=>{
    const storeValue = await getStore().get({});
    const folderId = fp.get('id', storeValue);
    const folder = folderId ? await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
        where: {
            id: folderId
        }
    }) : null;
    return fp.isNil(folder) ? createApiUploadFolder() : folder;
};
var apiUploadFolder = {
    getAPIUploadFolder
};

module.exports = apiUploadFolder;
//# sourceMappingURL=api-upload-folder.js.map
