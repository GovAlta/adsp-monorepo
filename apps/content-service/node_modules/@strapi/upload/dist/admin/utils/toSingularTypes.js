'use strict';

const toSingularTypes = (types)=>{
    if (!types) {
        return [];
    }
    return types.map((type)=>type.substring(0, type.length - 1));
};

exports.toSingularTypes = toSingularTypes;
//# sourceMappingURL=toSingularTypes.js.map
