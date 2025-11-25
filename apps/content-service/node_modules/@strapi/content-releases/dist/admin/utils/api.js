'use strict';

const isBaseQueryError = (error)=>{
    return typeof error !== 'undefined' && error.name !== undefined;
};

exports.isBaseQueryError = isBaseQueryError;
//# sourceMappingURL=api.js.map
