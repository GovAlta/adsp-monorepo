'use strict';

var fp = require('lodash/fp');
var pluralize = require('pluralize');

// TODO: create a utility for this
// Duplicate in server/src/services/schema-builder/component-builder.ts
const createComponentCollectionName = (name, category)=>{
    return `components_${fp.snakeCase(category)}_${pluralize(fp.snakeCase(name))}`;
};

exports.createComponentCollectionName = createComponentCollectionName;
//# sourceMappingURL=createCollectionName.js.map
