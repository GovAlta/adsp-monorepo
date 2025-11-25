import fse__default from 'fs-extra';
import path__default from 'path';
import { merge } from 'lodash';

const LOCAL_SAVE_FILENAME = '.strapi-cloud.json';
const getFilePath = (directoryPath)=>path__default.join(directoryPath || process.cwd(), LOCAL_SAVE_FILENAME);
async function save(data, { directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    // Ensure the directory exists and creates it if not
    await fse__default.ensureDir(path__default.dirname(pathToFile));
    await fse__default.writeJson(pathToFile, data, {
        encoding: 'utf8'
    });
}
async function retrieve({ directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    const pathExists = await fse__default.pathExists(pathToFile);
    if (!pathExists) {
        return {};
    }
    return fse__default.readJSON(pathToFile, {
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
    const newData = merge(existingData, patchData);
    await fse__default.writeJson(pathToFile, newData, {
        encoding: 'utf8'
    });
}
async function deleteConfig({ directoryPath } = {}) {
    const pathToFile = getFilePath(directoryPath);
    const pathExists = await fse__default.pathExists(pathToFile);
    if (pathExists) {
        await fse__default.remove(pathToFile);
    }
}

export { LOCAL_SAVE_FILENAME, deleteConfig, patch, retrieve, save };
//# sourceMappingURL=strapi-info-save.mjs.map
