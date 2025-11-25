'use strict';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const transformAttributesFromCTBToChat = (attributes)=>{
    return attributes.reduce((acc, attribute)=>{
        const { name, ...rest } = attribute;
        return {
            ...acc,
            [name]: rest
        };
    }, {});
};
const transformCTBToChat = (schema)=>{
    if (schema.modelType === 'component') {
        return {
            category: schema.category,
            kind: 'component',
            action: 'create',
            modelType: 'component',
            description: schema.info.description,
            name: schema.info.displayName,
            uid: schema.uid,
            attributes: transformAttributesFromCTBToChat(schema.attributes),
            // @ts-expect-error - injected from previous ai messages
            sources: schema.sources
        };
    }
    return {
        kind: schema.kind,
        modelType: schema.modelType,
        description: schema.info.description,
        action: 'create',
        name: schema.info.pluralName,
        uid: schema.uid,
        attributes: transformAttributesFromCTBToChat(schema.attributes),
        // @ts-expect-error - injected from previous ai messages
        sources: schema.sources,
        options: {
            draftAndPublish: schema.options?.draftAndPublish,
            localized: false
        }
    };
};

exports.transformCTBToChat = transformCTBToChat;
//# sourceMappingURL=fromCTB.js.map
