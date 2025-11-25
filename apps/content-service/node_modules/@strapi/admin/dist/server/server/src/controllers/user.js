'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');
var user$1 = require('../validation/user.js');
var index = require('../utils/index.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var ___namespace = /*#__PURE__*/_interopNamespaceDefault(_);

const { ApplicationError } = utils.errors;
var user = {
    async create (ctx) {
        const { body } = ctx.request;
        const cleanData = {
            ...body,
            email: ___namespace.get(body, `email`, ``).toLowerCase()
        };
        await user$1.validateUserCreationInput(cleanData);
        const attributes = ___namespace.pick(cleanData, [
            'firstname',
            'lastname',
            'email',
            'roles',
            'preferedLanguage'
        ]);
        const userAlreadyExists = await index.getService('user').exists({
            email: attributes.email
        });
        if (userAlreadyExists) {
            throw new ApplicationError('Email already taken');
        }
        const createdUser = await index.getService('user').create(attributes);
        const userInfo = index.getService('user').sanitizeUser(createdUser);
        // Note: We need to assign manually the registrationToken to the
        // final user payload so that it's not removed in the sanitation process.
        Object.assign(userInfo, {
            registrationToken: createdUser.registrationToken
        });
        // Send 201 created
        ctx.created({
            data: userInfo
        });
    },
    async find (ctx) {
        const userService = index.getService('user');
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: 'admin::user'
        });
        await permissionsManager.validateQuery(ctx.query);
        const sanitizedQuery = await permissionsManager.sanitizeQuery(ctx.query);
        // @ts-expect-error update the service type
        const { results, pagination } = await userService.findPage(sanitizedQuery);
        ctx.body = {
            data: {
                results: results.map((user)=>userService.sanitizeUser(user)),
                pagination
            }
        };
    },
    async findOne (ctx) {
        const { id } = ctx.params;
        const user = await index.getService('user').findOne(id);
        if (!user) {
            return ctx.notFound('User does not exist');
        }
        ctx.body = {
            data: index.getService('user').sanitizeUser(user)
        };
    },
    async update (ctx) {
        const { id } = ctx.params;
        const { body: input } = ctx.request;
        await user$1.validateUserUpdateInput(input);
        if (___namespace.has(input, 'email')) {
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
        const updatedUser = await index.getService('user').updateById(id, input);
        if (!updatedUser) {
            return ctx.notFound('User does not exist');
        }
        ctx.body = {
            data: index.getService('user').sanitizeUser(updatedUser)
        };
    },
    async deleteOne (ctx) {
        const { id } = ctx.params;
        const deletedUser = await index.getService('user').deleteById(id);
        if (!deletedUser) {
            return ctx.notFound('User not found');
        }
        return ctx.deleted({
            data: index.getService('user').sanitizeUser(deletedUser)
        });
    },
    /**
   * Delete several users
   * @param ctx - koa context
   */ async deleteMany (ctx) {
        const { body } = ctx.request;
        await user$1.validateUsersDeleteInput(body);
        const users = await index.getService('user').deleteByIds(body.ids);
        const sanitizedUsers = users.map(index.getService('user').sanitizeUser);
        return ctx.deleted({
            data: sanitizedUsers
        });
    }
};

module.exports = user;
//# sourceMappingURL=user.js.map
