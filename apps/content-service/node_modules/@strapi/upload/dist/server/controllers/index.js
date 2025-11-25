'use strict';

var adminFile = require('./admin-file.js');
var adminFolder = require('./admin-folder.js');
var adminFolderFile = require('./admin-folder-file.js');
var adminSettings = require('./admin-settings.js');
var adminUpload = require('./admin-upload.js');
var contentApi = require('./content-api.js');
var viewConfiguration = require('./view-configuration.js');

const controllers = {
    'admin-file': adminFile,
    'admin-folder': adminFolder,
    'admin-folder-file': adminFolderFile,
    'admin-settings': adminSettings,
    'admin-upload': adminUpload,
    'content-api': contentApi,
    'view-configuration': viewConfiguration
};

exports.controllers = controllers;
//# sourceMappingURL=index.js.map
