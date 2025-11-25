'use strict';

var strapiUtils = require('@strapi/utils');

const strapiServerSchema = strapiUtils.yup.object().shape({
    bootstrap: strapiUtils.yup.mixed().isFunction(),
    destroy: strapiUtils.yup.mixed().isFunction(),
    register: strapiUtils.yup.mixed().isFunction(),
    config: strapiUtils.yup.object(),
    routes: strapiUtils.yup.lazy((value)=>{
        if (Array.isArray(value)) {
            return strapiUtils.yup.array();
        }
        return strapiUtils.yup.object();
    }),
    controllers: strapiUtils.yup.object(),
    services: strapiUtils.yup.object(),
    policies: strapiUtils.yup.object(),
    middlewares: strapiUtils.yup.object(),
    contentTypes: strapiUtils.yup.object()
}).noUnknown();
const validateModule = (data)=>{
    return strapiServerSchema.validateSync(data, {
        strict: true,
        abortEarly: false
    });
};

exports.validateModule = validateModule;
//# sourceMappingURL=validation.js.map
