import { cloneDeep } from 'lodash/fp';
import { async } from '@strapi/utils';
import { FOLDER_MODEL_UID, FILE_MODEL_UID } from '../constants.mjs';
import { getService } from '../utils/index.mjs';

const getFolderPath = async (folderId)=>{
    if (!folderId) return '/';
    const parentFolder = await strapi.db.query(FOLDER_MODEL_UID).findOne({
        where: {
            id: folderId
        }
    });
    return parentFolder.path;
};
const deleteByIds = async (ids = [])=>{
    const filesToDelete = await strapi.db.query(FILE_MODEL_UID).findMany({
        where: {
            id: {
                $in: ids
            }
        }
    });
    await Promise.all(filesToDelete.map((file)=>getService('upload').remove(file)));
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
    const signedFile = cloneDeep(file);
    // Sign each file format
    await signUrl(signedFile);
    if (file.formats) {
        await async.map(Object.values(signedFile.formats ?? {}), signUrl);
    }
    return signedFile;
};
var file = {
    getFolderPath,
    deleteByIds,
    signFileUrls
};

export { file as default };
//# sourceMappingURL=file.mjs.map
