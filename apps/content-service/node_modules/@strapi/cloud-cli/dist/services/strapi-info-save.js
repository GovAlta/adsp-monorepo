'use strict';

var fse = require('fs-extra');
var path = require('path');
var lodash = require('lodash');

const LOCAL_SAVE_FILENAME = '.strapi-cloud.json';
const getFilePath = (directoryPath)=>path.join(directoryPath || process.cwd(), LOCAL_SAVE_FILENAME);
async function save(data, { directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    // Ensure the directory exists and creates it if not
    await fse.ensureDir(path.dirname(pathToFile));
    await fse.writeJson(pathToFile, data, {
        encoding: 'utf8'
    });
}
async function retrieve({ directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    const pathExists = await fse.pathExists(pathToFile);
    if (!pathExists) {
        return {};
    }
    return fse.readJSON(pathToFile, {
        encoding: 'utf8'
    });
}
async function patch(patchData, { directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    const existingData = await retrieve({
        directoryPath
    });
    if (!existingData) {
        throw new Error('No configuration data found to patch.');
    }
    const newData = lodash.merge(existingData, patchData);
    await fse.writeJson(pathToFile, newData, {
        encoding: 'utf8'
    });
}
async function deleteConfig({ directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    const pathExists = await fse.pathExists(pathToFile);
    if (pathExists) {
        await fse.remove(pathToFile);
    }
}

exports.LOCAL_SAVE_FILENAME = LOCAL_SAVE_FILENAME;
exports.deleteConfig = deleteConfig;
exports.patch = patch;
exports.retrieve = retrieve;
exports.save = save;
//# sourceMappingURL=strapi-info-save.js.map
