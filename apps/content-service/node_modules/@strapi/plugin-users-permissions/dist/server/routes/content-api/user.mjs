import require$$1 from 'zod/v4';
import { __require as requireValidation } from './validation.mjs';

var user;
var hasRequiredUser;
function requireUser() {
    if (hasRequiredUser) return user;
    hasRequiredUser = 1;
    const z = require$$1;
    const { UsersPermissionsRouteValidator } = requireValidation();
    user = (strapi)=>{
        const validator = new UsersPermissionsRouteValidator(strapi);
        return [
            {
                method: 'GET',
                path: '/users/count',
                handler: 'user.count',
                config: {
                    prefix: ''
                },
                request: {
                    query: {
                        filters: validator.filters.optional()
                    }
                },
                response: z.number()
            },
            {
                method: 'GET',
                path: '/users',
                handler: 'user.find',
                config: {
                    prefix: ''
                },
                request: {
                    query: {
                        fields: validator.queryFields.optional(),
                        populate: validator.queryPopulate.optional(),
                        sort: validator.querySort.optional(),
                        pagination: validator.pagination.optional(),
                        filters: validator.filters.optional()
                    }
                },
                response: z.array(validator.userSchema)
            },
            {
                method: 'GET',
                path: '/users/me',
                handler: 'user.me',
                config: {
                    prefix: ''
                },
                request: {
                    query: {
                        fields: validator.queryFields.optional(),
                        populate: validator.queryPopulate.optional()
                    }
                },
                response: validator.userSchema
            },
            {
                method: 'GET',
                path: '/users/:id',
                handler: 'user.findOne',
                config: {
                    prefix: ''
                },
                request: {
                    params: {
                        id: validator.userIdParam
                    },
                    query: {
                        fields: validator.queryFields.optional(),
                        populate: validator.queryPopulate.optional()
                    }
                },
                response: validator.userSchema
            },
            {
                method: 'POST',
                path: '/users',
                handler: 'user.create',
                config: {
                    prefix: ''
                },
                request: {
                    body: {
                        'application/json': validator.createUserBodySchema
                    }
                },
                response: validator.userSchema
            },
            {
                method: 'PUT',
                path: '/users/:id',
                handler: 'user.update',
                config: {
                    prefix: ''
                },
                request: {
                    params: {
                        id: validator.userIdParam
                    },
                    body: {
                        'application/json': validator.updateUserBodySchema
                    }
                },
                response: validator.userSchema
            },
            {
                method: 'DELETE',
                path: '/users/:id',
                handler: 'user.destroy',
                config: {
                    prefix: ''
                },
                request: {
                    params: {
                        id: validator.userIdParam
                    }
                },
                response: validator.userSchema
            }
        ];
    };
    return user;
}

export { requireUser as __require };
//# sourceMappingURL=user.mjs.map
