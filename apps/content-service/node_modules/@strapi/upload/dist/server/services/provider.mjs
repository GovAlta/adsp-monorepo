import { isFunction } from 'lodash/fp';
import { file } from '@strapi/utils';

var provider = (({ strapi })=>({
        async checkFileSize (file) {
            const { sizeLimit } = strapi.config.get('plugin::upload');
            await strapi.plugin('upload').provider.checkFileSize(file, {
                sizeLimit
            });
        },
        async upload (file$1) {
            if (isFunction(strapi.plugin('upload').provider.uploadStream)) {
                file$1.stream = file$1.getStream();
                await strapi.plugin('upload').provider.uploadStream(file$1);
                delete file$1.stream;
                if ('filepath' in file$1) {
                    delete file$1.filepath;
                }
            } else {
                file$1.buffer = await file.streamToBuffer(file$1.getStream());
                await strapi.plugin('upload').provider.upload(file$1);
                delete file$1.buffer;
                if ('filepath' in file$1) {
                    delete file$1.filepath;
                }
            }
        }
    }));

export { provider as default };
//# sourceMappingURL=provider.mjs.map
