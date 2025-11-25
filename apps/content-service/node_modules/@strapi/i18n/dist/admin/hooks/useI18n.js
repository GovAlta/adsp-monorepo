'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var strapiAdmin$1 = require('@strapi/content-manager/strapi-admin');
var reactRouterDom = require('react-router-dom');
var fields = require('../utils/fields.js');
var strings = require('../utils/strings.js');

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
 * @alpha
 * @description This hook is used to get the i18n status of a content type.
 * Also returns the CRUDP permission locale properties for the content type
 * so we know which locales the user can perform actions on.
 */ const useI18n = ()=>{
    // Extract the params from the URL to pass to our useDocument hook
    const params = reactRouterDom.useParams();
    const userPermissions = strapiAdmin.useAuth('useI18n', (state)=>state.permissions);
    const actions = React__namespace.useMemo(()=>{
        const permissions = userPermissions.filter((permission)=>permission.subject === params.slug);
        return permissions.reduce((acc, permission)=>{
            const [actionShorthand] = permission.action.split('.').slice(-1);
            return {
                ...acc,
                [`can${strings.capitalize(actionShorthand)}`]: permission.properties?.locales ?? []
            };
        }, {
            canCreate: [],
            canRead: [],
            canUpdate: [],
            canDelete: [],
            canPublish: []
        });
    }, [
        params.slug,
        userPermissions
    ]);
    // TODO: use specific hook to get schema only
    const { schema } = strapiAdmin$1.unstable_useDocument({
        // We can non-null assert these because below we skip the query if they are not present
        collectionType: params.collectionType,
        model: params.slug
    }, {
        skip: true
    });
    if (fields.doesPluginOptionsHaveI18nLocalized(schema?.pluginOptions)) {
        return {
            hasI18n: schema.pluginOptions.i18n.localized,
            ...actions
        };
    }
    return {
        hasI18n: false,
        ...actions
    };
};

exports.useI18n = useI18n;
//# sourceMappingURL=useI18n.js.map
