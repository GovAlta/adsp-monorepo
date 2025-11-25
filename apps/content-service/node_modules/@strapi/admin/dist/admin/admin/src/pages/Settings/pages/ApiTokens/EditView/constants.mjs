import * as yup from 'yup';
import { translatedErrors as errorsTrads } from '../../../../../utils/translatedErrors.mjs';

const schema = yup.object().shape({
    name: yup.string().max(100).required(errorsTrads.required.id),
    type: yup.string().oneOf([
        'read-only',
        'full-access',
        'custom'
    ]).required(errorsTrads.required.id),
    description: yup.string().nullable(),
    lifespan: yup.number().integer().min(0).nullable().defined(errorsTrads.required.id)
});

export { schema };
//# sourceMappingURL=constants.mjs.map
