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
 * Hook to detect the device type used by the user
 * @returns {DeviceType} The device type
 */ function useDeviceType() {
    const [deviceType, setDeviceType] = React__namespace.useState('desktop');
    React__namespace.useEffect(()=>{
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(userAgent)) {
            setDeviceType('mobile');
        } else if (/ipad|tablet|android(?!.*mobile)/.test(userAgent)) {
            setDeviceType('tablet');
        } else {
            setDeviceType('desktop');
        }
    }, []);
    return deviceType;
}

exports.useDeviceType = useDeviceType;
//# sourceMappingURL=useDeviceType.js.map
