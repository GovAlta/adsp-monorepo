'use strict';

class CoreService {
    getFetchParams(params = {}) {
        return {
            status: 'published',
            ...params
        };
    }
}

exports.CoreService = CoreService;
//# sourceMappingURL=core-service.js.map
