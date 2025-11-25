import ___default from 'lodash';
import { pick, isNil } from 'lodash/fp';
import { errors } from '@strapi/utils';
import { validateUserCreationInput } from '../validation/user.mjs';
import { validateUserUpdateInput } from '../../../../server/src/validation/user.mjs';
import { getService } from '../utils/index.mjs';
import { isSsoLocked } from '../utils/sso-lock.mjs';

const { ApplicationError, ForbiddenError } = errors;
const pickUserCreationAttributes = pick([
    'firstname',
    'lastname',
    'email',
    'roles'
]);
const hasAdminSeatsAvaialble = async ()=>{
    if (!strapi.EE) {
        return true;
    }
    const permittedSeats = strapi.ee.seats;
    if (isNil(permittedSeats)) {
        return true;
    }
    const userCount = await strapi.service('admin::user').getCurrentActiveUserCount();
    if (userCount < permittedSeats) {
        return true;
    }
};
var user = {
    async create (ctx) {
        if (!await hasAdminSeatsAvaialble()) {
            throw new ForbiddenError('License seat limit reached. You cannot create a new user');
        }
        const { body } = ctx.request;
        const cleanData = {
            ...body,
            email: ___default.get(body, `email`, ``).toLowerCase()
        };
        await validateUserCreationInput(cleanData);
        const attributes = pickUserCreationAttributes(cleanData);
        const { useSSORegistration } = cleanData;
        const userAlreadyExists = await getService('user').exists({
            email: attributes.email
        });
        if (userAlreadyExists) {
            throw new ApplicationError('Email already taken');
        }
        if (useSSORegistration) {
            Object.assign(attributes, {
                registrationToken: null,
                isActive: true
            });
        }
        const createdUser = await getService('user').create(attributes);
        const userInfo = getService('user').sanitizeUser(createdUser);
        // Note: We need to assign manually the registrationToken to the
        // final user payload so that it's not removed in the sanitation process.
        Object.assign(userInfo, {
            registrationToken: createdUser.registrationToken
        });
        ctx.created({
            data: userInfo
        });
    },
    async update (ctx) {
        const { id } = ctx.params;
        const { body: input } = ctx.request;
        await validateUserUpdateInput(input);
        if (___default.has(input, 'email')) {
            const uniqueEmailCheck = await getService('user').exists({
                id: {
                    $ne: id
                },
                email: input.email
            });
            if (uniqueEmailCheck) {
                throw new ApplicationError('A user with this email address already exists');
            }
        }
        const user = await getService('user').findOne(id, null);
        if (!await hasAdminSeatsAvaialble() && !user.isActive && input.isActive) {
            throw new ForbiddenError('License seat limit reached. You cannot active this user');
        }
        const updatedUser = await getService('user').updateById(id, input);
        if (!updatedUser) {
            return ctx.notFound('User does not exist');
        }
        ctx.body = {
            data: getService('user').sanitizeUser(updatedUser)
        };
    },
    async isSSOLocked (ctx) {
        const { user } = ctx.state;
        const isSSOLocked = await isSsoLocked(user);
        ctx.body = {
            data: {
                isSSOLocked
            }
        };
    }
};

export { user as default };
//# sourceMappingURL=user.mjs.map
