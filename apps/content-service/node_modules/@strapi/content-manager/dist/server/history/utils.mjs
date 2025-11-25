function getService(strapi, name) {
    // Cast is needed because the return type of strapi.service is too vague
    return strapi.service(`plugin::content-manager.${name}`);
}

export { getService };
//# sourceMappingURL=utils.mjs.map
