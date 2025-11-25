'use strict';

var constants = require('../services/constants.js');

const { SUPER_ADMIN_CODE } = constants;
/**
 * Create a new user model by merging default and specified attributes
 * @param attributes A partial user object
 */ function createUser(attributes) {
    return {
        roles: [],
        isActive: false,
        username: null,
        ...attributes
    };
}
const hasSuperAdminRole = (user)=>{
    return user.roles.filter((role)=>role.code === SUPER_ADMIN_CODE).length > 0;
};
const ADMIN_USER_ALLOWED_FIELDS = [
    'id',
    'firstname',
    'lastname',
    'username',
    'email',
    'isActive'
];

exports.ADMIN_USER_ALLOWED_FIELDS = ADMIN_USER_ALLOWED_FIELDS;
exports.createUser = createUser;
exports.hasSuperAdminRole = hasSuperAdminRole;
//# sourceMappingURL=user.js.map
