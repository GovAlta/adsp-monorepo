'use strict';

var React = require('react');

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
 * For more details about this hook see:
 * https://www.30secondsofcode.org/react/s/use-navigator-on-line
 */ const useNavigatorOnline = ()=>{
    const onlineStatus = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    const [isOnline, setIsOnline] = React__namespace.useState(onlineStatus);
    const setOnline = ()=>setIsOnline(true);
    const setOffline = ()=>setIsOnline(false);
    React__namespace.useEffect(()=>{
        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);
        return ()=>{
            window.removeEventListener('online', setOnline);
            window.removeEventListener('offline', setOffline);
        };
    }, []);
    return isOnline;
};

exports.useNavigatorOnline = useNavigatorOnline;
//# sourceMappingURL=useNavigatorOnline.js.map
