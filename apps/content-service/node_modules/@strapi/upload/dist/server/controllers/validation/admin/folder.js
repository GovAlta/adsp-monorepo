'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../../../utils/index.js');
var constants = require('../../../constants.js');
var utils$1 = require('./utils.js');
var folders = require('../../utils/folders.js');

const NO_SLASH_REGEX = /^[^/]+$/;
const NO_SPACES_AROUND = RegExp("^(?! ).+(?<! )$");
const isNameUniqueInFolder = (id)=>{
    return async function test(name) {
        const { exists } = index.getService('folder');
        const filters = {
            name,
            parent: this.parent.parent || null
        };
        if (id) {
            filters.id = {
                $ne: id
            };
            if (fp.isUndefined(name)) {
                const existingFolder = await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
                    where: {
                        id
                    }
                });
                filters.name = fp.get('name', existingFolder);
            }
        }
        const doesExist = await exists(filters);
        return !doesExist;
    };
};
const validateCreateFolderSchema = utils.yup.object().shape({
    name: utils.yup.string().min(1).matches(NO_SLASH_REGEX, 'name cannot contain slashes').matches(NO_SPACES_AROUND, 'name cannot start or end with a whitespace').required().test('is-folder-unique', 'A folder with this name already exists', isNameUniqueInFolder()),
    parent: utils.yup.strapiID().nullable().test('folder-exists', 'parent folder does not exist', utils$1.folderExists)
}).noUnknown().required();
const validateUpdateFolderSchema = (id)=>utils.yup.object().shape({
        name: utils.yup.string().min(1).matches(NO_SLASH_REGEX, 'name cannot contain slashes').matches(NO_SPACES_AROUND, 'name cannot start or end with a whitespace').test('is-folder-unique', 'A folder with this name already exists', isNameUniqueInFolder(id)),
        parent: utils.yup.strapiID().nullable().test('folder-exists', 'parent folder does not exist', utils$1.folderExists).test('dont-move-inside-self', 'folder cannot be moved inside itself', async function test(parent) {
            if (fp.isNil(parent)) return true;
            const destinationFolder = await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
                select: [
                    'path'
                ],
                where: {
                    id: parent
                }
            });
            const currentFolder = await strapi.db.query(constants.FOLDER_MODEL_UID).findOne({
                select: [
                    'path'
                ],
                where: {
                    id
                }
            });
            if (!destinationFolder || !currentFolder) return true;
            return !folders.isFolderOrChild(destinationFolder, currentFolder);
        })
    }).noUnknown().required();
const validateCreateFolder = utils.validateYupSchema(validateCreateFolderSchema);
const validateUpdateFolder = (id)=>utils.validateYupSchema(validateUpdateFolderSchema(id));

exports.validateCreateFolder = validateCreateFolder;
exports.validateUpdateFolder = validateUpdateFolder;
//# sourceMappingURL=folder.js.map
