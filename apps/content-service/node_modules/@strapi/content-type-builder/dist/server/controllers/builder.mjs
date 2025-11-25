import { getService } from '../utils/index.mjs';

var builder = {
    getReservedNames (ctx) {
        ctx.body = getService('builder').getReservedNames();
    }
};

export { builder as default };
//# sourceMappingURL=builder.mjs.map
