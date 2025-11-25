'use strict';

var loadValidators = ((strapi)=>{
    strapi.get('validators').set('content-api', {
        input: [],
        query: []
    });
});

module.exports = loadValidators;
//# sourceMappingURL=validators.js.map
