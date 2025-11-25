'use strict';

var winston = require('winston');
var index = require('./configs/index.js');
var index$1 = require('./formats/index.js');
var defaultConfiguration = require('./configs/default-configuration.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var winston__namespace = /*#__PURE__*/_interopNamespaceDefault(winston);

const createLogger = (userConfiguration = {})=>{
    const configuration = defaultConfiguration();
    Object.assign(configuration, userConfiguration);
    return winston__namespace.createLogger(configuration);
};

exports.winston = winston__namespace;
exports.configs = index;
exports.formats = index$1;
exports.createLogger = createLogger;
//# sourceMappingURL=index.js.map
