'use strict';

var require$$1 = require('@strapi/utils');

var user;
var hasRequiredUser;
function requireUser() {
    if (hasRequiredUser) return user;
    hasRequiredUser = 1;
    const { yup, validateYupSchema } = require$$1;
    const deleteRoleSchema = yup.object().shape({
        role: yup.strapiID().required()
    });
    const createUserBodySchema = yup.object().shape({
        email: yup.string().email().required(),
        username: yup.string().min(1).required(),
        password: yup.string().min(1).required(),
        role: yup.lazy((value)=>typeof value === 'object' ? yup.object().shape({
                connect: yup.array().of(yup.object().shape({
                    id: yup.strapiID().required()
                })).min(1, 'Users must have a role').required()
            }).required() : yup.strapiID().required())
    });
    const updateUserBodySchema = yup.object().shape({
        email: yup.string().email().min(1),
        username: yup.string().min(1),
        password: yup.mixed().test('password-validation', 'Password must be at least 1 character', function validatePassword(value) {
            if (value == null || value === '') {
                return true;
            }
            return typeof value === 'string' && value.length >= 1;
        }),
        role: yup.lazy((value)=>typeof value === 'object' ? yup.object().shape({
                connect: yup.array().of(yup.object().shape({
                    id: yup.strapiID().required()
                })).required(),
                disconnect: yup.array().test('CheckDisconnect', 'Cannot remove role', function test(disconnectValue) {
                    if (value.connect.length === 0 && disconnectValue.length > 0) {
                        return false;
                    }
                    return true;
                }).required()
            }) : yup.strapiID())
    });
    user = {
        validateCreateUserBody: validateYupSchema(createUserBodySchema),
        validateUpdateUserBody: validateYupSchema(updateUserBodySchema),
        validateDeleteRoleBody: validateYupSchema(deleteRoleSchema)
    };
    return user;
}

exports.__require = requireUser;
//# sourceMappingURL=user.js.map
