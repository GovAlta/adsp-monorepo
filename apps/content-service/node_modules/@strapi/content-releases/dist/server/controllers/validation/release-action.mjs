import { yup, validateYupSchema } from '@strapi/utils';

const RELEASE_ACTION_SCHEMA = yup.object().shape({
    contentType: yup.string().required(),
    entryDocumentId: yup.strapiID(),
    locale: yup.string(),
    type: yup.string().oneOf([
        'publish',
        'unpublish'
    ]).required()
});
const RELEASE_ACTION_UPDATE_SCHEMA = yup.object().shape({
    type: yup.string().oneOf([
        'publish',
        'unpublish'
    ]).required()
});
const FIND_MANY_ACTIONS_PARAMS = yup.object().shape({
    groupBy: yup.string().oneOf([
        'action',
        'contentType',
        'locale'
    ])
});
const validateReleaseAction = validateYupSchema(RELEASE_ACTION_SCHEMA);
const validateReleaseActionUpdateSchema = validateYupSchema(RELEASE_ACTION_UPDATE_SCHEMA);
const validateFindManyActionsParams = validateYupSchema(FIND_MANY_ACTIONS_PARAMS);

export { validateFindManyActionsParams, validateReleaseAction, validateReleaseActionUpdateSchema };
//# sourceMappingURL=release-action.mjs.map
