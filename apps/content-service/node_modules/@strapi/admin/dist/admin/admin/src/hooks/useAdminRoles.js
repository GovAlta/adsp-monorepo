'use strict';

var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var users = require('../services/users.js');

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

const useAdminRoles = (params = {}, queryOptions)=>{
    const { locale } = reactIntl.useIntl();
    const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const { data, error, isError, isLoading, refetch } = users.useGetRolesQuery(params, queryOptions);
    // the return value needs to be memoized, because intantiating
    // an empty array as default value would lead to an unstable return
    // value, which later on triggers infinite loops if used in the
    // dependency arrays of other hooks
    const roles = React__namespace.useMemo(()=>[
            ...data ?? []
        ].sort((a, b)=>formatter.compare(a.name, b.name)), [
        data,
        formatter
    ]);
    return {
        roles,
        error,
        isError,
        isLoading,
        refetch
    };
};

exports.useAdminRoles = useAdminRoles;
//# sourceMappingURL=useAdminRoles.js.map
