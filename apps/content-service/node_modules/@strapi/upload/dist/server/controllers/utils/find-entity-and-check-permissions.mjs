import _ from 'lodash';
import { contentTypes, errors } from '@strapi/utils';
import { getService } from '../../utils/index.mjs';

const findEntityAndCheckPermissions = async (ability, action, model, id)=>{
    const file = await getService('upload').findOne(id, [
        contentTypes.constants.CREATED_BY_ATTRIBUTE,
        'folder'
    ]);
    if (_.isNil(file)) {
        throw new errors.NotFoundError();
    }
    const pm = strapi.service('admin::permission').createPermissionsManager({
        ability,
        action,
        model
    });
    const creatorId = _.get(file, [
        contentTypes.constants.CREATED_BY_ATTRIBUTE,
        'id'
    ]);
    const author = creatorId ? await strapi.service('admin::user').findOne(creatorId, [
        'roles'
    ]) : null;
    const fileWithRoles = _.set(_.cloneDeep(file), 'createdBy', author);
    if (pm.ability.cannot(pm.action, pm.toSubject(fileWithRoles))) {
        throw new errors.ForbiddenError();
    }
    return {
        pm,
        file
    };
};

export { findEntityAndCheckPermissions };
//# sourceMappingURL=find-entity-and-check-permissions.mjs.map
