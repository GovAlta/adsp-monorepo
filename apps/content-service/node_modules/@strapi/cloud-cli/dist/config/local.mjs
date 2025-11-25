import path__default from 'path';
import os from 'os';
import fse__default from 'fs-extra';
import XDGAppPaths from 'xdg-app-paths';

const APP_FOLDER_NAME = 'com.strapi.cli';
const CONFIG_FILENAME = 'config.json';
async function checkDirectoryExists(directoryPath) {
    try {
        const fsStat = await fse__default.lstat(directoryPath);
        return fsStat.isDirectory();
    } catch (e) {
        return false;
    }
}
// Determine storage path based on the operating system
async function getTmpStoragePath() {
    const storagePath = path__default.join(os.tmpdir(), APP_FOLDER_NAME);
    await fse__default.ensureDir(storagePath);
    return storagePath;
}
async function getConfigPath() {
    const configDirs = XDGAppPaths(APP_FOLDER_NAME).configDirs();
    const configPath = configDirs.find(checkDirectoryExists);
    if (!configPath) {
        await fse__default.ensureDir(configDirs[0]);
        return configDirs[0];
    }
    return configPath;
}
async function getLocalConfig() {
    const configPath = await getConfigPath();
    const configFilePath = path__default.join(configPath, CONFIG_FILENAME);
    await fse__default.ensureFile(configFilePath);
    try {
        return await fse__default.readJSON(configFilePath, {
            encoding: 'utf8',
            throws: true
        });
    } catch (e) {
        return {};
    }
}
async function saveLocalConfig(data) {
    const configPath = await getConfigPath();
    const configFilePath = path__default.join(configPath, CONFIG_FILENAME);
    await fse__default.writeJson(configFilePath, data, {
        encoding: 'utf8',
        spaces: 2,
        mode: 0o600
    });
}

export { CONFIG_FILENAME, getLocalConfig, getTmpStoragePath, saveLocalConfig };
//# sourceMappingURL=local.mjs.map
