import history from './history/index.mjs';

const destroy = async ({ strapi })=>{
    await history.destroy?.({
        strapi
    });
};

export { destroy as default };
//# sourceMappingURL=destroy.mjs.map
