'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var constants = require('../../../constants.js');
var utils$1 = require('./utils.js');
var folders = require('../../utils/folders.js');

const validateDeleteManyFoldersFilesSchema = utils.yup.object().shape({
    fileIds: utils.yup.array().of(utils.yup.strapiID().required()),
    folderIds: utils.yup.array().of(utils.yup.strapiID().required())
}).noUnknown().required();
const validateStructureMoveManyFoldersFilesSchema = utils.yup.object().shape({
    destinationFolderId: utils.yup.strapiID().nullable().defined().test('folder-exists', 'destination folder does not exist', utils$1.folderExists),
    fileIds: utils.yup.array().of(utils.yup.strapiID().required()),
    folderIds: utils.yup.array().of(utils.yup.strapiID().required())
}).noUnknown().required();
const validateDuplicatesMoveManyFoldersFilesSchema = utils.yup.object().test('are-folders-unique', 'some folders already exist', async function areFoldersUnique(value) {
    const { folderIds, destinationFolderId } = value;
    if (fp.isEmpty(folderIds)) return true;
    const folders = await strapi.db.query(constants.FOLDER_MODEL_UID).findMany({
        select: [
            'name'
        ],
        where: {
            id: {
                $in: folderIds
            }
        }
    });
    const existingFolders = await strapi.db.query(constants.FOLDER_MODEL_UID).findMany({
        select: [
            'name'
        ],
        where: {
            parent: {
                id: destinationFolderId
            }
        }
    });
    const duplicatedNames = fp.intersection(fp.map('name', folders), fp.map('name', existingFolders));
    if (duplicatedNames.length > 0) {
        return this.createError({
            message: `some folders already exists: ${duplicatedNames.join(', ')}`
        });
    }
    return true;
});
const validateMoveFoldersNotInsideThemselvesSchema = utils.yup.object().test('dont-move-inside-self', 'folders cannot be moved inside themselves or one of its children', async function validateMoveFoldersNotInsideThemselves(value) {
    const { folderIds, destinationFolderId } = value;
    if (destinationFolderId === null || fp.isEmpty(folderIds)) return true;
    const destinationFolder = await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
        select: [
            'path'
        ],
        where: {
            id: destinationFolderId
        }
    });
    const folders$1 = await strapi.db.query(constants.FOLDER_MODEL_UID).findMany({
        select: [
            'name',
            'path'
        ],
        where: {
            id: {
                $in: folderIds
            }
        }
    });
    const unmovableFoldersNames = folders$1.filter((folder)=>folders.isFolderOrChild(destinationFolder, folder)).map((f)=>f.name);
    if (unmovableFoldersNames.length > 0) {
        return this.createError({
            message: `folders cannot be moved inside themselves or one of its children: ${unmovableFoldersNames.join(', ')}`
        });
    }
    return true;
});
const validateDeleteManyFoldersFiles = utils.validateYupSchema(validateDeleteManyFoldersFilesSchema);
async function validateMoveManyFoldersFiles(body) {
    await utils.validateYupSchema(validateStructureMoveManyFoldersFilesSchema)(body);
    await utils.validateYupSchema(validateDuplicatesMoveManyFoldersFilesSchema)(body);
    await utils.validateYupSchema(validateMoveFoldersNotInsideThemselvesSchema)(body);
}

exports.validateDeleteManyFoldersFiles = validateDeleteManyFoldersFiles;
exports.validateMoveManyFoldersFiles = validateMoveManyFoldersFiles;
//# sourceMappingURL=folder-file.js.map
