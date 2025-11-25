'use strict';

var z = require('zod/v4');
var zod = require('../utils/zod.js');

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

var z__namespace = /*#__PURE__*/_interopNamespaceDefault(z);

class ComponentsWriter {
    postProcess(context) {
        const { output } = context;
        const { schemas } = z__namespace.toJSONSchema(z__namespace.globalRegistry, {
            uri: zod.toComponentsPath
        });
        output.data.components = {
            schemas
        };
    }
}

exports.ComponentsWriter = ComponentsWriter;
//# sourceMappingURL=component-writer.js.map
