'use strict';

var createDebug = require('debug');
var constants = require('../constants.js');

const createDebugger = (section = null, namespace = constants.DEBUG_NAMESPACE)=>{
    return section !== null ? createDebug(`${namespace}:${section}`) : createDebug(namespace);
};

exports.createDebugger = createDebugger;
//# sourceMappingURL=debug.js.map
