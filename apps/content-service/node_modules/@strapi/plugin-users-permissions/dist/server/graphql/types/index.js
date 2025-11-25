'use strict';

var me = require('./me.js');
var meRole = require('./me-role.js');
var registerInput = require('./register-input.js');
var loginInput = require('./login-input.js');
var passwordPayload = require('./password-payload.js');
var loginPayload = require('./login-payload.js');
var createRolePayload = require('./create-role-payload.js');
var updateRolePayload = require('./update-role-payload.js');
var deleteRolePayload = require('./delete-role-payload.js');
var userInput = require('./user-input.js');

var types;
var hasRequiredTypes;
function requireTypes() {
    if (hasRequiredTypes) return types;
    hasRequiredTypes = 1;
    const typesFactories = [
        me.__require(),
        meRole.__require(),
        registerInput.__require(),
        loginInput.__require(),
        passwordPayload.__require(),
        loginPayload.__require(),
        createRolePayload.__require(),
        updateRolePayload.__require(),
        deleteRolePayload.__require(),
        userInput.__require()
    ];
    /**
	 * @param {object} context
	 * @param {object} context.nexus
	 * @param {object} context.strapi
	 * @return {any[]}
	 */ types = (context)=>typesFactories.map((factory)=>factory(context));
    return types;
}

exports.__require = requireTypes;
//# sourceMappingURL=index.js.map
