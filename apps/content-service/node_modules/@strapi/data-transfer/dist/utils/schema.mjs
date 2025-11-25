import { mapValues, pick } from 'lodash/fp';

/**
 * List of schema properties that should be kept when sanitizing schemas
 */ const VALID_SCHEMA_PROPERTIES = [
    'collectionName',
    'info',
    'options',
    'pluginOptions',
    'attributes',
    'kind',
    'modelType',
    'modelName',
    'uid',
    'plugin',
    'globalId'
];
/**
 * Sanitize a schemas dictionary by omitting unwanted properties
 * The list of allowed properties can be found here: {@link VALID_SCHEMA_PROPERTIES}
 */ const mapSchemasValues = (schemas)=>{
    return mapValues(pick(VALID_SCHEMA_PROPERTIES), schemas);
};
const schemasToValidJSON = (schemas)=>{
    return JSON.parse(JSON.stringify(schemas));
};

export { mapSchemasValues, schemasToValidJSON };
//# sourceMappingURL=schema.mjs.map
