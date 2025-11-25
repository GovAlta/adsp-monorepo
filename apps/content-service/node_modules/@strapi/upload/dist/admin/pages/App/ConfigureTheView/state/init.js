'use strict';

const initialState = {
    initialData: {},
    modifiedData: {}
};
const init = (configData)=>{
    return {
        ...initialState,
        initialData: configData,
        modifiedData: configData
    };
};

exports.init = init;
exports.initialState = initialState;
//# sourceMappingURL=init.js.map
