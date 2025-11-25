'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');

var provider = (({ strapi })=>({
        async checkFileSize (file) {
            const { sizeLimit } = strapi.config.get('plugin::upload');
            await strapi.plugin('upload').provider.checkFileSize(file, {
                sizeLimit
            });
        },
        async upload (file) {
            if (fp.isFunction(strapi.plugin('upload').provider.uploadStream)) {
                file.stream = file.getStream();
                await strapi.plugin('upload').provider.uploadStream(file);
                delete file.stream;
                if ('filepath' in file) {
                    delete file.filepath;
                }
            } else {
                file.buffer = await utils.file.streamToBuffer(file.getStream());
                await strapi.plugin('upload').provider.upload(file);
                delete file.buffer;
                if ('filepath' in file) {
                    delete file.filepath;
                }
            }
        }
    }));

module.exports = provider;
//# sourceMappingURL=provider.js.map
