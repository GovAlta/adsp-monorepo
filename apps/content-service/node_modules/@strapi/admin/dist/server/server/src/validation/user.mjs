import { isUndefined } from 'lodash/fp';
import { yup, validateYupSchema } from '@strapi/utils';
import validators from './common-validators.mjs';

const userCreationSchema = yup.object().shape({
    email: validators.email.required(),
    firstname: validators.firstname.required(),
    lastname: validators.lastname,
    roles: validators.roles.min(1),
    preferedLanguage: yup.string().nullable()
}).noUnknown();
const profileUpdateSchema = yup.object().shape({
    email: validators.email.notNull(),
    firstname: validators.firstname.notNull(),
    lastname: validators.lastname.nullable(),
    username: validators.username.nullable(),
    password: validators.password.notNull(),
    currentPassword: yup.string().when('password', (password, schema)=>!isUndefined(password) ? schema.required() : schema).notNull(),
    preferedLanguage: yup.string().nullable()
}).noUnknown();
const userUpdateSchema = yup.object().shape({
    email: validators.email.notNull(),
    firstname: validators.firstname.notNull(),
    lastname: validators.lastname.nullable(),
    username: validators.username.nullable(),
    password: validators.password.notNull(),
    isActive: yup.bool().notNull(),
    roles: validators.roles.min(1).notNull()
}).noUnknown();
const usersDeleteSchema = yup.object().shape({
    ids: yup.array().of(yup.strapiID()).min(1).required()
}).noUnknown();
const validateUserCreationInput = validateYupSchema(userCreationSchema);
const validateProfileUpdateInput = validateYupSchema(profileUpdateSchema);
const validateUserUpdateInput = validateYupSchema(userUpdateSchema);
const validateUsersDeleteInput = validateYupSchema(usersDeleteSchema);
const schemas = {
    userCreationSchema,
    usersDeleteSchema,
    userUpdateSchema
};

export { schemas, validateProfileUpdateInput, validateUserCreationInput, validateUserUpdateInput, validateUsersDeleteInput };
//# sourceMappingURL=user.mjs.map
