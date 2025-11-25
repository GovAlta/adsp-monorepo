import { yup, validateYupSchema } from '@strapi/utils';

const RELEASE_SCHEMA = yup.object().shape({
    name: yup.string().trim().required(),
    scheduledAt: yup.string().nullable(),
    timezone: yup.string().when('scheduledAt', {
        is: (value)=>value !== null && value !== undefined,
        then: yup.string().required(),
        otherwise: yup.string().nullable()
    })
}).required().noUnknown();
const FIND_BY_DOCUMENT_ATTACHED_PARAMS_SCHEMA = yup.object().shape({
    contentType: yup.string().required(),
    entryDocumentId: yup.string().nullable(),
    hasEntryAttached: yup.string().nullable(),
    locale: yup.string().nullable()
}).required().noUnknown();
const validateRelease = validateYupSchema(RELEASE_SCHEMA);
const validatefindByDocumentAttachedParams = validateYupSchema(FIND_BY_DOCUMENT_ATTACHED_PARAMS_SCHEMA);

export { RELEASE_SCHEMA, validateRelease, validatefindByDocumentAttachedParams };
//# sourceMappingURL=release.mjs.map
