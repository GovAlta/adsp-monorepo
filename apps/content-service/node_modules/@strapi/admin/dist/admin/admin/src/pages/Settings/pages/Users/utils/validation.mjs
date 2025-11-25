import * as yup from 'yup';
import { translatedErrors as errorsTrads } from '../../../../../utils/translatedErrors.mjs';

/**
 * @description This needs wrapping in `yup.object().shape()` before use.
 */ const COMMON_USER_SCHEMA = {
    firstname: yup.string().trim().required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }),
    lastname: yup.string().nullable(),
    email: yup.string().email(errorsTrads.email).lowercase().required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }),
    username: yup.string().transform((value)=>value === '' ? undefined : value).nullable(),
    password: yup.string().transform((value)=>value === '' || value === null ? undefined : value).nullable().min(8, {
        ...errorsTrads.minLength,
        values: {
            min: 8
        }
    }).test('max-bytes', {
        id: 'components.Input.error.contain.maxBytes',
        defaultMessage: 'Password must be less than 73 bytes'
    }, function(value) {
        if (!value) return true;
        return new TextEncoder().encode(value).length <= 72;
    }).matches(/[a-z]/, {
        id: 'components.Input.error.contain.lowercase',
        defaultMessage: 'Password must contain at least one lowercase character'
    }).matches(/[A-Z]/, {
        id: 'components.Input.error.contain.uppercase',
        defaultMessage: 'Password must contain at least one uppercase character'
    }).matches(/\d/, {
        id: 'components.Input.error.contain.number',
        defaultMessage: 'Password must contain at least one number'
    }),
    confirmPassword: yup.string().transform((value)=>value === '' ? null : value).nullable().min(8, {
        ...errorsTrads.minLength,
        values: {
            min: 8
        }
    }).oneOf([
        yup.ref('password'),
        null
    ], {
        id: 'components.Input.error.password.noMatch',
        defaultMessage: 'Passwords must match'
    }).when('password', (password, passSchema)=>{
        return password ? passSchema.required({
            id: errorsTrads.required.id,
            defaultMessage: 'This field is required'
        }).nullable() : passSchema;
    })
};

export { COMMON_USER_SCHEMA };
//# sourceMappingURL=validation.mjs.map
