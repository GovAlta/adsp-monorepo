'use strict';

var React = require('react');
var useIsMounted = require('./useIsMounted.js');

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

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

/**
 * @internal
 * @description Return a function that re-renders this component, if still mounted
 * @warning DO NOT USE EXCEPT SPECIAL CASES.
 */ const useForceUpdate = ()=>{
    const [tick, update] = React__namespace.useState();
    const isMounted = useIsMounted.useIsMounted();
    const forceUpdate = React__namespace.useCallback(()=>{
        if (isMounted.current) {
            update(Math.random());
        }
    }, [
        isMounted,
        update
    ]);
    return [
        tick,
        forceUpdate
    ];
};

exports.useForceUpdate = useForceUpdate;
//# sourceMappingURL=useForceUpdate.js.map
