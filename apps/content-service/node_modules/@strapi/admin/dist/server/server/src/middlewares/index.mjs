import rateLimit from './rateLimit.mjs';
import dataTransfer from './data-transfer.mjs';

var middlewares = {
    rateLimit,
    'data-transfer': dataTransfer
};

export { dataTransfer, middlewares as default, rateLimit };
//# sourceMappingURL=index.mjs.map
