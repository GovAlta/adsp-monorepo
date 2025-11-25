class AbstractContextFactory {
    create(context, defaultValue) {
        const { strapi, routes } = context;
        // Allow overrides to share registries and timer in case the context is used in sub-assemblers
        const timer = context.timer ?? this._timerFactory.create();
        const registries = context.registries ?? this._registriesFactory.createAll();
        // Default output initialized with the given default value
        const output = this.createDefaultOutput(defaultValue);
        return {
            strapi,
            routes,
            timer,
            registries,
            output
        };
    }
    createDefaultOutput(data) {
        return {
            stats: {
                time: {
                    startTime: 0,
                    endTime: 0,
                    elapsedTime: 0
                }
            },
            data
        };
    }
    constructor(registriesFactory, timerFactory){
        this._registriesFactory = registriesFactory;
        this._timerFactory = timerFactory;
    }
}

export { AbstractContextFactory };
//# sourceMappingURL=abstract.mjs.map
