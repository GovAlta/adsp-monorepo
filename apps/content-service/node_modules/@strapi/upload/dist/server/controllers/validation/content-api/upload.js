'use strict';

var utils = require('@strapi/utils');

const fileInfoSchema = utils.yup.object({
    name: utils.yup.string().nullable(),
    alternativeText: utils.yup.string().nullable(),
    caption: utils.yup.string().nullable()
}).noUnknown();
const uploadSchema = utils.yup.object({
    fileInfo: fileInfoSchema
});
const multiUploadSchema = utils.yup.object({
    fileInfo: utils.yup.array().of(fileInfoSchema)
});
const validateUploadBody = (data = {}, isMulti = false)=>{
    const schema = isMulti ? multiUploadSchema : uploadSchema;
    return utils.validateYupSchema(schema, {
        strict: false
    })(data);
};

exports.validateUploadBody = validateUploadBody;
//# sourceMappingURL=upload.js.map
