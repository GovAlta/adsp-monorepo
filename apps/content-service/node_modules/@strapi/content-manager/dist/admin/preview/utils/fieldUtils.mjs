// Generic error class for preview field operations
class PreviewFieldError extends Error {
    constructor(messageKey){
        super(messageKey);
        this.name = 'PreviewFieldError';
        this.messageKey = messageKey;
    }
}
// Helper function to parse path with array indices and return clean attribute names
const parsePathWithIndices = (path)=>{
    // Split by dots, then parse array indices from each part. For example:
    // input "components.4.field.relations.2.name"
    // output [{name: "components", index: 4}, {name: "field"}, {name: "relations", index: 2}, {name: "name"}]
    return path.split('.').map((part)=>{
        const numericIndex = parseInt(part, 10);
        if (!isNaN(numericIndex) && part === numericIndex.toString()) {
            // This part is a pure numeric index, return it as an index for the previous part
            return {
                name: '',
                index: numericIndex
            };
        }
        return {
            name: part
        };
    }).reduce((acc, part)=>{
        if (part.name === '' && part.index !== undefined) {
            // This is an index, attach it to the previous part
            if (acc.length > 0) {
                acc[acc.length - 1].index = part.index;
            }
        } else {
            acc.push(part);
        }
        return acc;
    }, []);
};
function getAttributeSchemaFromPath({ path, schema, components, document }) {
    /**
   * Create the function that will be recursively called.
   * We don't do recursion on getAttributeSchemaFromPath itself because:
   * - it takes a path string, not the parsed array that's better for recursion
   * - even when several levels deep, we still need access to the root schema and components
   */ const visitor = (currentPathParts, currentAttributes, currentData)=>{
        const [currentPart, ...remainingParts] = currentPathParts;
        // Get the data and schema for the current path
        const currentAttribute = currentAttributes[currentPart.name];
        if (!currentAttribute) {
            throw new PreviewFieldError('INVALID_FIELD_PATH');
        }
        if (currentAttribute.type === 'relation') {
            throw new PreviewFieldError('RELATIONS_NOT_HANDLED');
        }
        if (currentAttribute.type === 'component') {
            const componentAttributes = components[currentAttribute.component].attributes;
            if (currentAttribute.repeatable) {
                // We must have the index, otherwise we don't know what data to use
                if (currentPart.index === undefined) {
                    throw new PreviewFieldError('INVALID_FIELD_PATH');
                }
                return visitor(remainingParts, componentAttributes, currentData[currentPart.name][currentPart.index]);
            }
            // Non repeatable component
            return visitor(remainingParts, componentAttributes, currentData[currentPart.name]);
        }
        if (currentAttribute.type === 'dynamiczone') {
            // We must have the index, otherwise we don't know what component we're dealing with
            if (currentPart.index === undefined) {
                throw new PreviewFieldError('INVALID_FIELD_PATH');
            }
            const componentData = currentData[currentPart.name][currentPart.index];
            const componentAttributes = components[componentData.__component].attributes;
            return visitor(remainingParts, componentAttributes, componentData);
        }
        // Plain regular field. It ends the recursion
        return currentAttributes[currentPart.name];
    };
    return visitor(parsePathWithIndices(path), schema.attributes, document);
}
function parseFieldMetaData(strapiSource) {
    const searchParams = new URLSearchParams(strapiSource);
    const path = searchParams.get('path');
    const type = searchParams.get('type');
    const documentId = searchParams.get('documentId');
    const locale = searchParams.get('locale');
    const model = searchParams.get('model');
    const kind = searchParams.get('kind');
    if (!path || !type || !documentId || !model) {
        return null;
    }
    return {
        path,
        type: type,
        documentId,
        locale: locale ?? null,
        model: model,
        kind: kind ? kind : undefined
    };
}

export { PreviewFieldError, getAttributeSchemaFromPath, parseFieldMetaData, parsePathWithIndices };
//# sourceMappingURL=fieldUtils.mjs.map
