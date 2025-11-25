'use strict';

var zod = require('zod');
var utils = require('@strapi/utils');

const MAX_IMAGE_WIDTH = 750;
const MAX_IMAGE_HEIGHT = MAX_IMAGE_WIDTH;
const MAX_IMAGE_FILE_SIZE = 1024 * 1024; // 1Mo
const updateProjectSettings = zod.z.object({
    menuLogo: zod.z.string().nullish(),
    authLogo: zod.z.string().nullish()
}).strict();
const updateProjectSettingsLogo = zod.z.object({
    originalFilename: zod.z.string().nullish(),
    mimetype: zod.z.enum([
        'image/jpeg',
        'image/png',
        'image/svg+xml'
    ]),
    size: zod.z.number().max(MAX_IMAGE_FILE_SIZE).nullish()
});
const updateProjectSettingsFiles = zod.z.object({
    menuLogo: updateProjectSettingsLogo.nullish(),
    authLogo: updateProjectSettingsLogo.nullish()
}).strict();
const logoDimensions = zod.z.object({
    width: zod.z.number().max(MAX_IMAGE_WIDTH).nullish(),
    height: zod.z.number().max(MAX_IMAGE_HEIGHT).nullish()
});
const updateProjectSettingsImagesDimensions = zod.z.object({
    menuLogo: logoDimensions.nullish(),
    authLogo: logoDimensions.nullish()
}).strict();
const validateUpdateProjectSettings = utils.validateZod(updateProjectSettings);
const validateUpdateProjectSettingsFiles = utils.validateZod(updateProjectSettingsFiles);
const validateUpdateProjectSettingsImagesDimensions = utils.validateZod(updateProjectSettingsImagesDimensions);

exports.validateUpdateProjectSettings = validateUpdateProjectSettings;
exports.validateUpdateProjectSettingsFiles = validateUpdateProjectSettingsFiles;
exports.validateUpdateProjectSettingsImagesDimensions = validateUpdateProjectSettingsImagesDimensions;
//# sourceMappingURL=project-settings.js.map
