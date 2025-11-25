import history from './history/index.mjs';
import preview from './preview/index.mjs';

const register = async ({ strapi })=>{
    await history.register?.({
        strapi
    });
    await preview.register?.({
        strapi
    });
};

export { register as default };
//# sourceMappingURL=register.mjs.map
