const registry = ()=>{
    const models = [];
    return {
        add (model) {
            models.push(model);
            return this;
        },
        get () {
            return models;
        }
    };
};

export { registry };
//# sourceMappingURL=models.mjs.map
