const prefixPluginTranslations = (trad, pluginId)=>{
    return Object.keys(trad).reduce((acc, current)=>{
        acc[`${pluginId}.${current}`] = trad[current];
        return acc;
    }, {});
};
const getTranslation = (id)=>`content-manager.${id}`;

export { getTranslation, prefixPluginTranslations };
//# sourceMappingURL=translations.mjs.map
