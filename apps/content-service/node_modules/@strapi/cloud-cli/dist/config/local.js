'use strict';

var path = require('path');
var os = require('os');
var fse = require('fs-extra');
var XDGAppPaths = require('xdg-app-paths');

const APP_FOLDER_NAME = 'com.strapi.cli';
const CONFIG_FILENAME = 'config.json';
async function checkDirectoryExists(directoryPath) {
    try {
        const fsStat = await fse.lstat(directoryPath);
        return fsStat.isDirectory();
    } catch (e) {
        return false;
    }
}
// Determine storage path based on the operating system
async function getTmpStoragePath() {
    const storagePath = path.join(os.tmpdir(), APP_FOLDER_NAME);
    await fse.ensureDir(storagePath);
    return storagePath;
}
async function getConfigPath() {
    const configDirs = XDGAppPaths(APP_FOLDER_NAME).configDirs();
    const configPath = configDirs.find(checkDirectoryExists);
    if (!configPath) {
        await fse.ensureDir(configDirs[0]);
        return configDirs[0];
    }
    return configPath;
}
async function getLocalConfig() {
    const configPath = await getConfigPath();
    const configFilePath = path.join(configPath, CONFIG_FILENAME);
    await fse.ensureFile(configFilePath);
    try {
        return await fse.readJSON(configFilePath, {
            encoding: 'utf8',
            throws: true
        });
    } catch (e) {
        return {};
    }
}
async function saveLocalConfig(data) {
    const configPath = await getConfigPath();
    const configFilePath = path.join(configPath, CONFIG_FILENAME);
    await fse.writeJson(configFilePath, data, {
        encoding: 'utf8',
        spaces: 2,
        mode: 0o600
    });
}

exports.CONFIG_FILENAME = CONFIG_FILENAME;
exports.getLocalConfig = getLocalConfig;
exports.getTmpStoragePath = getTmpStoragePath;
exports.saveLocalConfig = saveLocalConfig;
//# sourceMappingURL=local.js.map
