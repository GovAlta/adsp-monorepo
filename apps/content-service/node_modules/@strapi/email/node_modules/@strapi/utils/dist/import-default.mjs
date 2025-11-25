/* eslint-disable @typescript-eslint/no-var-requires */ function importDefault(modName) {
    const mod = require(modName);
    return mod && mod.__esModule ? mod.default : mod;
}

export { importDefault as default };
//# sourceMappingURL=import-default.mjs.map
