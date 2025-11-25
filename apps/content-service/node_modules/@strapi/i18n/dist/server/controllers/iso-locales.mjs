import { getService } from '../utils/index.mjs';

const controller = {
    listIsoLocales (ctx) {
        const isoLocalesService = getService('iso-locales');
        ctx.body = isoLocalesService.getIsoLocales();
    }
};

export { controller as default };
//# sourceMappingURL=iso-locales.mjs.map
