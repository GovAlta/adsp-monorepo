'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');
var index = require('../../utils/index.js');

const findEntityAndCheckPermissions = async (ability, action, model, id)=>{
    const file = await index.getService('upload').findOne(id, [
        utils.contentTypes.constants.CREATED_BY_ATTRIBUTE,
        'folder'
    ]);
    if (_.isNil(file)) {
        throw new utils.errors.NotFoundError();
    }
    const pm = strapi.service('admin::permission').createPermissionsManager({
        ability,
        action,
        model
    });
    const creatorId = _.get(file, [
        utils.contentTypes.constants.CREATED_BY_ATTRIBUTE,
        'id'
    ]);
    const author = creatorId ? await strapi.service('admin::user').findOne(creatorId, [
        'roles'
    ]) : null;
    const fileWithRoles = _.set(_.cloneDeep(file), 'createdBy', author);
    if (pm.ability.cannot(pm.action, pm.toSubject(fileWithRoles))) {
        throw new utils.errors.ForbiddenError();
    }
    return {
        pm,
        file
    };
};

exports.findEntityAndCheckPermissions = findEntityAndCheckPermissions;
//# sourceMappingURL=find-entity-and-check-permissions.js.map
