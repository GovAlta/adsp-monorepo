'use strict';

var loadSanitizers = ((strapi)=>{
    strapi.get('sanitizers').set('content-api', {
        input: [],
        output: [],
        query: []
    });
});

module.exports = loadSanitizers;
//# sourceMappingURL=sanitizers.js.map
