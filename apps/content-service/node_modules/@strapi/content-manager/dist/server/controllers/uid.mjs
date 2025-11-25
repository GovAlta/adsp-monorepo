import { getService } from '../utils/index.mjs';
import { getDocumentLocaleAndStatus } from './validation/dimensions.mjs';
import { validateGenerateUIDInput, validateUIDField, validateCheckUIDAvailabilityInput } from './validation/index.mjs';

var uid = {
    async generateUID (ctx) {
        const { contentTypeUID, field, data } = await validateGenerateUIDInput(ctx.request.body);
        const { query = {} } = ctx.request;
        const { locale } = await getDocumentLocaleAndStatus(query, contentTypeUID);
        await validateUIDField(contentTypeUID, field);
        const uidService = getService('uid');
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
        const { contentTypeUID, field, value } = await validateCheckUIDAvailabilityInput(ctx.request.body);
        const { query = {} } = ctx.request;
        const { locale } = await getDocumentLocaleAndStatus(query, contentTypeUID);
        await validateUIDField(contentTypeUID, field);
        const uidService = getService('uid');
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

export { uid as default };
//# sourceMappingURL=uid.mjs.map
