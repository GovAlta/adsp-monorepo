'use strict';

var utils = require('@strapi/utils');
var commonValidators = require('./common-validators.js');

const registerProviderActionSchema = utils.yup.array().required().of(utils.yup.object().shape({
    uid: utils.yup.string().matches(/^[a-z]([a-z|.|-]+)[a-z]$/, (v)=>`${v.path}: The uid can only contain lowercase letters, dots and hyphens.`).required(),
    section: utils.yup.string().oneOf([
        'contentTypes',
        'plugins',
        'settings',
        'internal'
    ]).required(),
    pluginName: utils.yup.mixed().when('section', {
        is: 'plugins',
        then: commonValidators.default.isAPluginName.required(),
        otherwise: commonValidators.default.isAPluginName
    }),
    subjects: utils.yup.mixed().when('section', {
        is: 'contentTypes',
        then: utils.yup.array().of(utils.yup.string()).required(),
        otherwise: utils.yup.mixed().oneOf([
            undefined
        ], 'subjects should only be defined for the "contentTypes" section')
    }),
    displayName: utils.yup.string().required(),
    category: utils.yup.mixed().when('section', {
        is: 'settings',
        then: utils.yup.string().required(),
        otherwise: utils.yup.mixed().test('settingsCategory', 'category should only be defined for the "settings" section', (cat)=>cat === undefined)
    }),
    subCategory: utils.yup.mixed().when('section', {
        is: (section)=>[
                'settings',
                'plugins'
            ].includes(section),
        then: utils.yup.string(),
        otherwise: utils.yup.mixed().test('settingsSubCategory', 'subCategory should only be defined for "plugins" and "settings" sections', (subCat)=>{
            return subCat === undefined;
        })
    }),
    options: utils.yup.object({
        applyToProperties: utils.yup.array().of(utils.yup.string())
    }),
    aliases: utils.yup.array(utils.yup.object({
        actionId: utils.yup.string(),
        subjects: utils.yup.array(utils.yup.string()).nullable()
    })).nullable()
}).noUnknown());
const validateRegisterProviderAction = utils.validateYupSchemaSync(registerProviderActionSchema);

exports.validateRegisterProviderAction = validateRegisterProviderAction;
//# sourceMappingURL=action-provider.js.map
