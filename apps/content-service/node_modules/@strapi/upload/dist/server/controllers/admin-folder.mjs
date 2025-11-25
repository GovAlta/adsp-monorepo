import { defaultsDeep } from 'lodash/fp';
import { getService } from '../utils/index.mjs';
import { FOLDER_MODEL_UID } from '../constants.mjs';
import { validateCreateFolder, validateUpdateFolder } from './validation/admin/folder.mjs';

var adminFolder = {
    async findOne (ctx) {
        const { id } = ctx.params;
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: FOLDER_MODEL_UID
        });
        await permissionsManager.validateQuery(ctx.query);
        const query = await permissionsManager.sanitizeQuery(ctx.query);
        const { results } = await strapi.db.query(FOLDER_MODEL_UID).findPage(strapi.get('query-params').transform(FOLDER_MODEL_UID, defaultsDeep({
            filters: {
                id
            },
            populate: {
                children: {
                    count: true
                },
                files: {
                    count: true
                }
            }
        }, query)));
        if (results.length === 0) {
            return ctx.notFound('folder not found');
        }
        ctx.body = {
            data: await permissionsManager.sanitizeOutput(results[0])
        };
    },
    async find (ctx) {
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: FOLDER_MODEL_UID
        });
        await permissionsManager.validateQuery(ctx.query);
        const query = await permissionsManager.sanitizeQuery(ctx.query);
        const results = await strapi.db.query(FOLDER_MODEL_UID).findMany(strapi.get('query-params').transform(FOLDER_MODEL_UID, defaultsDeep({
            populate: {
                children: {
                    count: true
                },
                files: {
                    count: true
                }
            }
        }, query)));
        ctx.body = {
            data: await permissionsManager.sanitizeOutput(results)
        };
    },
    async create (ctx) {
        const { user } = ctx.state;
        const { body } = ctx.request;
        await validateCreateFolder(body);
        const folderService = getService('folder');
        const folder = await folderService.create(body, {
            user
        });
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: FOLDER_MODEL_UID
        });
        ctx.created({
            data: await permissionsManager.sanitizeOutput(folder)
        });
    },
    async update (ctx) {
        const { id } = ctx.params;
        const { user } = ctx.state;
        const { body } = ctx.request;
        const permissionsManager = strapi.service('admin::permission').createPermissionsManager({
            ability: ctx.state.userAbility,
            model: FOLDER_MODEL_UID
        });
        await validateUpdateFolder(id)(body);
        const folderService = getService('folder');
        const updatedFolder = await folderService.update(id, body, {
            user
        });
        if (!updatedFolder) {
            return ctx.notFound('folder not found');
        }
        ctx.body = {
            data: await permissionsManager.sanitizeOutput(updatedFolder)
        };
    },
    async getStructure (ctx) {
        const { getStructure } = getService('folder');
        const structure = await getStructure();
        ctx.body = {
            data: structure
        };
    }
};

export { adminFolder as default };
//# sourceMappingURL=admin-folder.mjs.map
