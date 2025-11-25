'use strict';

var index$1 = require('../utils/index.js');
var dimensions = require('./validation/dimensions.js');
var index = require('./validation/index.js');

var uid = {
    async generateUID (ctx) {
        const { contentTypeUID, field, data } = await index.validateGenerateUIDInput(ctx.request.body);
        const { query = {} } = ctx.request;
        const { locale } = await dimensions.getDocumentLocaleAndStatus(query, contentTypeUID);
        await index.validateUIDField(contentTypeUID, field);
        const uidService = index$1.getService('uid');
        ctx.body = {
            data: await uidService.generateUIDField({
                contentTypeUID,
                field,
                data,
                locale
            })
        };
    },
    async checkUIDAvailability (ctx) {
        const { contentTypeUID, field, value } = await index.validateCheckUIDAvailabilityInput(ctx.request.body);
        const { query = {} } = ctx.request;
        const { locale } = await dimensions.getDocumentLocaleAndStatus(query, contentTypeUID);
        await index.validateUIDField(contentTypeUID, field);
        const uidService = index$1.getService('uid');
        const isAvailable = await uidService.checkUIDAvailability({
            contentTypeUID,
            field,
            value,
            locale
        });
        ctx.body = {
            isAvailable,
            suggestion: !isAvailable ? await uidService.findUniqueUID({
                contentTypeUID,
                field,
                value,
                locale
            }) : null
        };
    }
};

module.exports = uid;
//# sourceMappingURL=uid.js.map
