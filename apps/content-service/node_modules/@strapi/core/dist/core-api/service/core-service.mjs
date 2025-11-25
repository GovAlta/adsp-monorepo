class CoreService {
    getFetchParams(params = {}) {
        return {
            status: 'published',
            ...params
        };
    }
}

export { CoreService };
//# sourceMappingURL=core-service.mjs.map
