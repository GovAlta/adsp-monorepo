'use strict';

var React = require('react');
var designSystem = require('@strapi/design-system');

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

function isEnterprise() {
    return window.strapi.isEE;
}
const useEnterprise = (ceData, eeCallback, opts = {})=>{
    const { defaultValue = null, combine = (_ceData, eeData)=>eeData, enabled = true } = opts;
    const eeCallbackRef = designSystem.useCallbackRef(eeCallback);
    const combineCallbackRef = designSystem.useCallbackRef(combine);
    // We have to use a nested object here, because functions (e.g. Components)
    // can not be stored as value directly
    const [{ data }, setData] = React__namespace.useState({
        data: isEnterprise() && enabled ? defaultValue : ceData
    });
    React__namespace.useEffect(()=>{
        async function importEE() {
            const eeData = await eeCallbackRef();
            const combinedValue = combineCallbackRef(ceData, eeData);
            setData({
                data: combinedValue ? combinedValue : eeData
            });
        }
        if (isEnterprise() && enabled) {
            importEE();
        }
    }, [
        ceData,
        eeCallbackRef,
        combineCallbackRef,
        enabled
    ]);
    // @ts-expect-error – the hook type assertion works in practice. But seems to have issues here...
    return data;
};

exports.useEnterprise = useEnterprise;
//# sourceMappingURL=useEnterprise.js.map
