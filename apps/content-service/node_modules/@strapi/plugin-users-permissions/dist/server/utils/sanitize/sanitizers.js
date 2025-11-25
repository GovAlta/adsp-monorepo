'use strict';

var require$$0 = require('lodash/fp');
var require$$1 = require('@strapi/utils');
var index = require('./visitors/index.js');

var sanitizers;
var hasRequiredSanitizers;
function requireSanitizers() {
    if (hasRequiredSanitizers) return sanitizers;
    hasRequiredSanitizers = 1;
    const { curry } = require$$0;
    const { traverseEntity, async } = require$$1;
    const { removeUserRelationFromRoleEntities } = index.__require();
    const sanitizeUserRelationFromRoleEntities = curry((schema, entity)=>{
        return traverseEntity(removeUserRelationFromRoleEntities, {
            schema,
            getModel: strapi.getModel.bind(strapi)
        }, entity);
    });
    const defaultSanitizeOutput = curry((schema, entity)=>{
        return async.pipe(sanitizeUserRelationFromRoleEntities(schema))(entity);
    });
    sanitizers = {
        sanitizeUserRelationFromRoleEntities,
        defaultSanitizeOutput
    };
    return sanitizers;
}

exports.__require = requireSanitizers;
//# sourceMappingURL=sanitizers.js.map
