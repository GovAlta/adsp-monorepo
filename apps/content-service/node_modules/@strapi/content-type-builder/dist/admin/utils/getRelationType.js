'use strict';

/**
 *
 * Retrieves the relation type
 */ const getRelationType = (relation, targetAttribute)=>{
    const hasNotTargetAttribute = targetAttribute === undefined || targetAttribute === null;
    if (relation === 'oneToOne' && hasNotTargetAttribute) {
        return 'oneWay';
    }
    if (relation === 'oneToMany' && hasNotTargetAttribute) {
        return 'manyWay';
    }
    return relation;
};

exports.getRelationType = getRelationType;
//# sourceMappingURL=getRelationType.js.map
