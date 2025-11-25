'use strict';

var idMap = require('./id-map.js');
var dataIds = require('./relations/extract/data-ids.js');
var dataIds$1 = require('./relations/transform/data-ids.js');
var defaultLocale = require('./relations/transform/default-locale.js');

/**
 * Transforms input data, containing relation document ids, to entity ids.
 */ const transformData = async (data, opts)=>{
    const idMap$1 = idMap.createIdMap({
        strapi
    });
    // Assign default locales
    const transformedData = await defaultLocale.setDefaultLocaleToRelations(data, opts.uid);
    // Extract any relation ids from the input
    await dataIds.extractDataIds(idMap$1, transformedData, opts);
    // Load any relation the extract methods found
    await idMap$1.load();
    // Transform any relation ids to entity ids
    return dataIds$1.transformDataIdsVisitor(idMap$1, transformedData, opts);
};

exports.transformData = transformData;
//# sourceMappingURL=data.js.map
