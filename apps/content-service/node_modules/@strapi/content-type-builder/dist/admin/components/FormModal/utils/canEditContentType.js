'use strict';

var getRelationType = require('../../../utils/getRelationType.js');

const canEditContentType = (type, modifiedData)=>{
    const kind = type.kind;
    // if kind isn't modified or content type is a single type, there is no need to check attributes.
    if (kind === 'singleType' || kind === modifiedData.kind) {
        return true;
    }
    const contentTypeAttributes = type?.attributes ?? [];
    const relationAttributes = contentTypeAttributes.filter((attribute)=>{
        if (attribute.type !== 'relation') {
            return false;
        }
        const { relation, targetAttribute } = attribute;
        const relationType = getRelationType.getRelationType(relation, targetAttribute);
        return ![
            'oneWay',
            'manyWay'
        ].includes(relationType || '');
    });
    return relationAttributes.length === 0;
};

exports.canEditContentType = canEditContentType;
//# sourceMappingURL=canEditContentType.js.map
