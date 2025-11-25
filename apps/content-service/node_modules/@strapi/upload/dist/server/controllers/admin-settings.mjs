import { getService } from '../utils/index.mjs';
import { ACTIONS, FILE_MODEL_UID } from '../constants.mjs';
import validateSettings from './validation/admin/settings.mjs';

var adminSettings = {
    async updateSettings (ctx) {
        const { request: { body }, state: { userAbility } } = ctx;
        if (userAbility.cannot(ACTIONS.readSettings, FILE_MODEL_UID)) {
            return ctx.forbidden();
        }
        const data = await validateSettings(body);
        await getService('upload').setSettings(data);
        ctx.body = {
            data
        };
    },
    async getSettings (ctx) {
        const { state: { userAbility } } = ctx;
        if (userAbility.cannot(ACTIONS.readSettings, FILE_MODEL_UID)) {
            return ctx.forbidden();
        }
        const data = await getService('upload').getSettings();
        ctx.body = {
            data
        };
    }
};

export { adminSettings as default };
//# sourceMappingURL=admin-settings.mjs.map
