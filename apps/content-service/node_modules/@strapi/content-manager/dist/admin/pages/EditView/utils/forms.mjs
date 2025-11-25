/* -------------------------------------------------------------------------------------------------
 * createDefaultForm
 * -----------------------------------------------------------------------------------------------*/ /**
 * @internal Using the content-type schema & the components dictionary of the content-type,
 * creates a form with pre-filled default values. This is used when creating a new entry.
 */ const createDefaultForm = (contentType, components = {})=>{
    const traverseSchema = (attributes)=>{
        return Object.entries(attributes).reduce((acc, [key, attribute])=>{
            if ('default' in attribute) {
                acc[key] = attribute.default;
            } else if (attribute.type === 'component' && attribute.required) {
                const defaultComponentForm = traverseSchema(components[attribute.component].attributes);
                if (attribute.repeatable) {
                    acc[key] = attribute.min ? [
                        ...Array(attribute.min).fill(defaultComponentForm)
                    ] : [];
                } else {
                    acc[key] = defaultComponentForm;
                }
            } else if (attribute.type === 'dynamiczone' && attribute.required) {
                acc[key] = [];
            }
            return acc;
        }, {});
    };
    return traverseSchema(contentType.attributes);
};

export { createDefaultForm };
//# sourceMappingURL=forms.mjs.map
