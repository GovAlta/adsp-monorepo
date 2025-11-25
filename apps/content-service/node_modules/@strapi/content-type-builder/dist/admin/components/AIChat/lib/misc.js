'use strict';

const generateId = (size = 16)=>{
    return crypto.randomUUID().slice(0, size);
};

exports.generateId = generateId;
//# sourceMappingURL=misc.js.map
