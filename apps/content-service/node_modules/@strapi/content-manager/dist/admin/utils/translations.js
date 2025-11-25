'use strict';

const prefixPluginTranslations = (trad, pluginId)=>{
    return Object.keys(trad).reduce((acc, current)=>{
        acc[`${pluginId}.${current}`] = trad[current];
        return acc;
    }, {});
};
const getTranslation = (id)=>`content-manager.${id}`;

exports.getTranslation = getTranslation;
exports.prefixPluginTranslations = prefixPluginTranslations;
//# sourceMappingURL=translations.js.map
