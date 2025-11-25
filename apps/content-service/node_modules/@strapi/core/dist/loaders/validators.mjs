var loadValidators = ((strapi)=>{
    strapi.get('validators').set('content-api', {
        input: [],
        query: []
    });
});

export { loadValidators as default };
//# sourceMappingURL=validators.mjs.map
