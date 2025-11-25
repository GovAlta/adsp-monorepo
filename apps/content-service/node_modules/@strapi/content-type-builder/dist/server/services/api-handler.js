'use strict';

var path = require('path');
var fse = require('fs-extra');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var fse__namespace = /*#__PURE__*/_interopNamespaceDefault(fse);

/**
 * Deletes the API folder of a contentType
 */ async function clear(uid) {
    // TODO double check if this is the correct way to get the apiName
    const { apiName, modelName } = strapi.contentTypes[uid];
    const apiFolder = path__namespace.join(strapi.dirs.app.api, apiName);
    await recursiveRemoveFiles(apiFolder, createDeleteApiFunction(modelName));
    await deleteBackup(uid);
}
/**
 * Backups the API folder of a contentType
 * @param {string} uid content type uid
 */ async function backup(uid) {
    const { apiName } = strapi.contentTypes[uid];
    const apiFolder = path__namespace.join(strapi.dirs.app.api, apiName);
    const backupFolder = path__namespace.join(strapi.dirs.app.api, '.backup', apiName);
    // backup the api folder
    await fse__namespace.copy(apiFolder, backupFolder);
}
/**
 * Deletes an API backup folder
 */ async function deleteBackup(uid) {
    const { apiName } = strapi.contentTypes[uid];
    const backupFolder = path__namespace.join(strapi.dirs.app.api, '.backup');
    const apiBackupFolder = path__namespace.join(strapi.dirs.app.api, '.backup', apiName);
    await fse__namespace.remove(apiBackupFolder);
    const list = await fse__namespace.readdir(backupFolder);
    if (list.length === 0) {
        await fse__namespace.remove(backupFolder);
    }
}
/**
 * Rollbacks the API folder of a contentType
 */ async function rollback(uid) {
    const { apiName } = strapi.contentTypes[uid];
    const apiFolder = path__namespace.join(strapi.dirs.app.api, apiName);
    const backupFolder = path__namespace.join(strapi.dirs.app.api, '.backup', apiName);
    try {
        await fse__namespace.access(backupFolder);
    } catch  {
        throw new Error('Cannot rollback api that was not backed up');
    }
    await fse__namespace.remove(apiFolder);
    await fse__namespace.copy(backupFolder, apiFolder);
    await deleteBackup(uid);
}
/**
 * Creates a delete function to clear an api folder
 */ const createDeleteApiFunction = (baseName)=>{
    /**
   * Delets a file in an api.
   * Will only update routes.json instead of deleting it if other routes are present
   */ return async (filePath)=>{
        const fileName = path__namespace.basename(filePath, path__namespace.extname(filePath));
        const isSchemaFile = filePath.endsWith(`${baseName}/schema.json`);
        if (fileName === baseName || isSchemaFile) {
            return fse__namespace.remove(filePath);
        }
    };
};
/**
 * Deletes a folder recursively using a delete function
 * @param {string} folder folder to delete
 */ const recursiveRemoveFiles = async (folder, deleteFn)=>{
    const filesName = await fse__namespace.readdir(folder);
    for (const fileName of filesName){
        const filePath = path__namespace.join(folder, fileName);
        const stat = await fse__namespace.stat(filePath);
        if (stat.isDirectory()) {
            await recursiveRemoveFiles(filePath, deleteFn);
        } else {
            await deleteFn(filePath);
        }
    }
    const files = await fse__namespace.readdir(folder);
    if (files.length === 0) {
        await fse__namespace.remove(folder);
    }
};

exports.backup = backup;
exports.clear = clear;
exports.rollback = rollback;
//# sourceMappingURL=api-handler.js.map
