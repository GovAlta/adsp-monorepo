import { defineProvider } from './provider.mjs';
import { coreStoreModel, createCoreStore } from '../services/core-store.mjs';

var coreStore = defineProvider({
    init (strapi) {
        strapi.get('models').add(coreStoreModel);
        strapi.add('coreStore', ()=>createCoreStore({
                db: strapi.db
            }));
    }
});

export { coreStore as default };
//# sourceMappingURL=coreStore.mjs.map
