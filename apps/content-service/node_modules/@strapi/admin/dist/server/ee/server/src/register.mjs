import register$1 from '../../../server/src/register.mjs';

var register = (async ({ strapi })=>{
    await register$1({
        strapi
    });
});

export { register as default };
//# sourceMappingURL=register.mjs.map
