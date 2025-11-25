import { getService } from '../utils/index.mjs';
import { ACTIONS } from '../constants.mjs';
import { validateViewConfiguration } from './validation/admin/configureView.mjs';

var viewConfiguration = {
    async updateViewConfiguration (ctx) {
        const { request: { body }, state: { userAbility } } = ctx;
        if (userAbility.cannot(ACTIONS.configureView)) {
            return ctx.forbidden();
        }
        const data = await validateViewConfiguration(body);
        await getService('upload').setConfiguration(data);
        ctx.body = {
            data
        };
    },
    async findViewConfiguration (ctx) {
        const data = await getService('upload').getConfiguration();
        ctx.body = {
            data
        };
    }
};

export { viewConfiguration as default };
//# sourceMappingURL=view-configuration.mjs.map
