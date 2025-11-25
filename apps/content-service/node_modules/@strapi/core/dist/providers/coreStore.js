'use strict';

var provider = require('./provider.js');
var coreStore$1 = require('../services/core-store.js');

var coreStore = provider.defineProvider({
    init (strapi) {
        strapi.get('models').add(coreStore$1.coreStoreModel);
        strapi.add('coreStore', ()=>coreStore$1.createCoreStore({
                db: strapi.db
            }));
    }
});

module.exports = coreStore;
//# sourceMappingURL=coreStore.js.map
