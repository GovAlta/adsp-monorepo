'use strict';

require('lodash');

const isValidSubscriber = (subscriber)=>{
    return typeof subscriber === 'function' || typeof subscriber === 'object' && subscriber !== null;
};

exports.isValidSubscriber = isValidSubscriber;
//# sourceMappingURL=index.js.map
