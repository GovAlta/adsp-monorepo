const isLocalizedContentType = (uid)=>{
    const model = strapi.getModel(uid);
    return strapi.plugin('i18n').service('content-types').isLocalizedContentType(model);
};
const getDefaultLocale = ()=>{
    return strapi.plugin('i18n').service('locales').getDefaultLocale();
};
const getRelationTargetLocale = (relation, opts)=>{
    const targetLocale = relation.locale || opts.sourceLocale;
    const isTargetLocalized = isLocalizedContentType(opts.targetUid);
    const isSourceLocalized = isLocalizedContentType(opts.sourceUid);
    // Both source and target locales should match
    if (isSourceLocalized && isTargetLocalized) {
        return opts.sourceLocale;
    }
    if (isTargetLocalized) {
        return targetLocale;
    }
    return null;
};

export { getDefaultLocale, getRelationTargetLocale, isLocalizedContentType };
//# sourceMappingURL=i18n.mjs.map
