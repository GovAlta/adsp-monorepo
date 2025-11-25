import { yup, validateYupSchema } from '@strapi/utils';

const settingsSchema = yup.object({
    sizeOptimization: yup.boolean().required(),
    responsiveDimensions: yup.boolean().required(),
    autoOrientation: yup.boolean(),
    aiMetadata: yup.boolean().default(true)
});
var validateSettings = validateYupSchema(settingsSchema);

export { validateSettings as default };
//# sourceMappingURL=settings.mjs.map
