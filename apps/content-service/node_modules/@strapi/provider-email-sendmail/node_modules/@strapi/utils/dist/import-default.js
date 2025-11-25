'use strict';

/* eslint-disable @typescript-eslint/no-var-requires */ function importDefault(modName) {
    const mod = require(modName);
    return mod && mod.__esModule ? mod.default : mod;
}

module.exports = importDefault;
//# sourceMappingURL=import-default.js.map
