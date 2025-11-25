'use strict';

const init = (state, permissions, routes)=>{
    return {
        ...state,
        initialData: permissions,
        modifiedData: permissions,
        routes
    };
};

module.exports = init;
//# sourceMappingURL=init.js.map
