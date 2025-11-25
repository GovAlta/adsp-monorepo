'use strict';

const init = (initialState, permissions)=>{
    const collapses = Object.keys(permissions).sort().map((name)=>({
            name,
            isOpen: false
        }));
    return {
        ...initialState,
        collapses
    };
};

module.exports = init;
//# sourceMappingURL=init.js.map
