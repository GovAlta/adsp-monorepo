'use strict';

var React = require('react');
var admin = require('../../../../admin/src/services/admin.js');

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

function useLicenseLimits({ enabled } = {
    enabled: true
}) {
    const { data, isError, isLoading } = admin.useGetLicenseLimitsQuery(undefined, {
        skip: !enabled
    });
    const getFeature = React__namespace.useCallback((name)=>{
        const feature = data?.data?.features.find((feature)=>feature.name === name);
        if (feature && 'options' in feature) {
            return feature.options;
        } else {
            return {};
        }
    }, [
        data
    ]);
    return {
        license: data?.data,
        getFeature,
        isError,
        isLoading,
        isTrial: data?.data?.isTrial ?? false
    };
}

exports.useLicenseLimits = useLicenseLimits;
//# sourceMappingURL=useLicenseLimits.js.map
