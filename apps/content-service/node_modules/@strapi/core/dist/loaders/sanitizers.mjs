var loadSanitizers = ((strapi)=>{
    strapi.get('sanitizers').set('content-api', {
        input: [],
        output: [],
        query: []
    });
});

export { loadSanitizers as default };
//# sourceMappingURL=sanitizers.mjs.map
