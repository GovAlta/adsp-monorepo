'use strict';

const prefixPluginTranslations = (trad, pluginId)=>{
    if (!pluginId) {
        throw new TypeError("pluginId can't be empty");
    }
    return Object.keys(trad).reduce((acc, current)=>{
        acc[`${pluginId}.${current}`] = trad[current];
        return acc;
    }, {});
};

exports.prefixPluginTranslations = prefixPluginTranslations;
//# sourceMappingURL=prefixPluginTranslations.js.map
