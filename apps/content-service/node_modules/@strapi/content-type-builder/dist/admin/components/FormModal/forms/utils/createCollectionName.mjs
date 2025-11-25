import { snakeCase } from 'lodash/fp';
import pluralize from 'pluralize';

// TODO: create a utility for this
// Duplicate in server/src/services/schema-builder/component-builder.ts
const createComponentCollectionName = (name, category)=>{
    return `components_${snakeCase(category)}_${pluralize(snakeCase(name))}`;
};

export { createComponentCollectionName };
//# sourceMappingURL=createCollectionName.mjs.map
