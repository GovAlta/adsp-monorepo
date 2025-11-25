import { yup, validateYupSchemaSync } from '@strapi/utils';

const hasPermissionsSchema = yup.object({
    actions: yup.array().of(yup.string()),
    hasAtLeastOne: yup.boolean()
});
const validateHasPermissionsInput = validateYupSchemaSync(hasPermissionsSchema);

export { validateHasPermissionsInput };
//# sourceMappingURL=hasPermissions.mjs.map
