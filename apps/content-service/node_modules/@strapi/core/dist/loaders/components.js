'use strict';

var path = require('path');
var _ = require('lodash');
var fse = require('fs-extra');
var loadFiles = require('../utils/load-files.js');

async function loadComponents(strapi) {
    if (!await fse.pathExists(strapi.dirs.dist.components)) {
        return {};
    }
    const map = await loadFiles.loadFiles(strapi.dirs.dist.components, '*/*.*(js|json)');
    const components = Object.keys(map).reduce((acc, category)=>{
        Object.keys(map[category]).forEach((key)=>{
            const schema = map[category][key];
            if (!schema.collectionName) {
                // NOTE: We're using the filepath from the app directory instead of the dist for information purpose
                const filePath = path.join(strapi.dirs.app.components, category, schema.__filename__);
                return strapi.stopWithError(`Component ${key} is missing a "collectionName" property.\nVerify file ${filePath}.`);
            }
            const uid = `${category}.${key}`;
            acc[uid] = Object.assign(schema, {
                __schema__: _.cloneDeep(schema),
                uid,
                category,
                modelType: 'component',
                modelName: key,
                globalId: schema.globalId || _.upperFirst(_.camelCase(`component_${uid}`))
            });
        });
        return acc;
    }, {});
    strapi.get('components').add(components);
}

module.exports = loadComponents;
//# sourceMappingURL=components.js.map
