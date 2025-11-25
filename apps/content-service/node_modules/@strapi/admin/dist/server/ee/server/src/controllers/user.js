'use strict';

var _ = require('lodash');
var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var user$1 = require('../validation/user.js');
var user$2 = require('../../../../server/src/validation/user.js');
var index = require('../utils/index.js');
var ssoLock = require('../utils/sso-lock.js');

const { ApplicationError, ForbiddenError } = utils.errors;
const pickUserCreationAttributes = fp.pick([
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
    if (fp.isNil(permittedSeats)) {
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
            email: _.get(body, `email`, ``).toLowerCase()
        };
        await user$1.validateUserCreationInput(cleanData);
        const attributes = pickUserCreationAttributes(cleanData);
        const { useSSORegistration } = cleanData;
        const userAlreadyExists = await index.getService('user').exists({
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
        const createdUser = await index.getService('user').create(attributes);
        const userInfo = index.getService('user').sanitizeUser(createdUser);
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
        await user$2.validateUserUpdateInput(input);
        if (_.has(input, 'email')) {
            const uniqueEmailCheck = await index.getService('user').exists({
                id: {
                    $ne: id
                },
                email: input.email
            });
            if (uniqueEmailCheck) {
                throw new ApplicationError('A user with this email address already exists');
            }
        }
        const user = await index.getService('user').findOne(id, null);
        if (!await hasAdminSeatsAvaialble() && !user.isActive && input.isActive) {
            throw new ForbiddenError('License seat limit reached. You cannot active this user');
        }
        const updatedUser = await index.getService('user').updateById(id, input);
        if (!updatedUser) {
            return ctx.notFound('User does not exist');
        }
        ctx.body = {
            data: index.getService('user').sanitizeUser(updatedUser)
        };
    },
    async isSSOLocked (ctx) {
        const { user } = ctx.state;
        const isSSOLocked = await ssoLock.isSsoLocked(user);
        ctx.body = {
            data: {
                isSSOLocked
            }
        };
    }
};

module.exports = user;
//# sourceMappingURL=user.js.map
