'use strict';

var index$2 = require('../domain/permission/index.js');
var provider = require('../domain/action/provider.js');
var provider$1 = require('../domain/condition/provider.js');
var index = require('./permission/permissions-manager/index.js');
var engine$1 = require('./permission/engine.js');
var index$1 = require('./permission/sections-builder/index.js');
var queries = require('./permission/queries.js');

const actionProvider = provider();
const conditionProvider = provider$1();
const sectionsBuilder = index$1();
const sanitizePermission = index$2.default.sanitizePermissionFields;
const engine = engine$1({
    providers: {
        action: actionProvider,
        condition: conditionProvider
    }
});

exports.createPermissionsManager = index;
exports.cleanPermissionsInDatabase = queries.cleanPermissionsInDatabase;
exports.createMany = queries.createMany;
exports.deleteByIds = queries.deleteByIds;
exports.deleteByRolesIds = queries.deleteByRolesIds;
exports.findMany = queries.findMany;
exports.findUserPermissions = queries.findUserPermissions;
exports.actionProvider = actionProvider;
exports.conditionProvider = conditionProvider;
exports.engine = engine;
exports.sanitizePermission = sanitizePermission;
exports.sectionsBuilder = sectionsBuilder;
//# sourceMappingURL=permission.js.map
