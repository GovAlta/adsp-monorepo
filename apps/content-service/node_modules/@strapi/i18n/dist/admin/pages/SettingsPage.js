'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var CreateLocale = require('../components/CreateLocale.js');
var LocaleTable = require('../components/LocaleTable.js');
var constants = require('../constants.js');
var locales = require('../services/locales.js');
var getTranslation = require('../utils/getTranslation.js');

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

const SettingsPage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { data: locales$1, isLoading: isLoadingLocales, error } = locales.useGetLocalesQuery();
    const { isLoading: isLoadingRBAC, allowedActions: { canUpdate, canCreate, canDelete } } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    const isLoading = isLoadingLocales || isLoadingRBAC;
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    if (error || !Array.isArray(locales$1)) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Error, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Page.Main, {
        tabIndex: -1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
                primaryAction: /*#__PURE__*/ jsxRuntime.jsx(CreateLocale.CreateLocale, {
                    disabled: !canCreate
                }),
                title: formatMessage({
                    id: getTranslation.getTranslation('plugin.name'),
                    defaultMessage: 'Internationalization'
                }),
                subtitle: formatMessage({
                    id: getTranslation.getTranslation('Settings.list.description'),
                    defaultMessage: 'Configure the settings'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Content, {
                children: locales$1.length > 0 ? /*#__PURE__*/ jsxRuntime.jsx(LocaleTable.LocaleTable, {
                    locales: locales$1,
                    canDelete: canDelete,
                    canUpdate: canUpdate
                }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.EmptyStateLayout, {
                    icon: /*#__PURE__*/ jsxRuntime.jsx(symbols.EmptyDocuments, {
                        width: undefined,
                        height: undefined
                    }),
                    content: formatMessage({
                        id: getTranslation.getTranslation('Settings.list.empty.title'),
                        defaultMessage: 'There are no locales'
                    }),
                    action: /*#__PURE__*/ jsxRuntime.jsx(CreateLocale.CreateLocale, {
                        disabled: !canCreate,
                        variant: "secondary"
                    })
                })
            })
        ]
    });
};
const ProtectedSettingsPage = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Protect, {
        permissions: constants.PERMISSIONS.read,
        children: /*#__PURE__*/ jsxRuntime.jsx(SettingsPage, {})
    });
};

exports.ProtectedSettingsPage = ProtectedSettingsPage;
exports.SettingsPage = SettingsPage;
//# sourceMappingURL=SettingsPage.js.map
