'use strict';

var get = require('lodash/get');
var makeUnique = require('../../../utils/makeUnique.js');

const retrieveSpecificInfoFromComponents = (allComponents, keysToRetrieve)=>{
    const allData = Object.keys(allComponents).map((compo)=>{
        return get(allComponents, [
            compo,
            ...keysToRetrieve
        ], '');
    });
    return makeUnique.makeUnique(allData);
};

exports.retrieveSpecificInfoFromComponents = retrieveSpecificInfoFromComponents;
//# sourceMappingURL=retrieveSpecificInfoFromComponents.js.map
