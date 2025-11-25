'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var Layout = require('../../../components/Layouts/Layout.js');
var PageHelpers = require('../../../components/PageHelpers.js');
var hooks = require('../../../core/store/hooks.js');
var Notifications = require('../../../features/Notifications.js');
var useAPIErrorHandler = require('../../../hooks/useAPIErrorHandler.js');
var admin = require('../../../services/admin.js');

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

const InstalledPlugins = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { notifyStatus } = designSystem.useNotifyAT();
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const { isLoading, data, error } = admin.useGetPluginsQuery();
    React__namespace.useEffect(()=>{
        if (data) {
            notifyStatus(formatMessage({
                id: 'app.utils.notify.data-loaded',
                defaultMessage: 'The {target} has loaded'
            }, {
                target: formatMessage({
                    id: 'global.plugins',
                    defaultMessage: 'Plugins'
                })
            }));
        }
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        data,
        error,
        formatAPIError,
        formatMessage,
        notifyStatus,
        toggleNotification
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Main, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Header, {
                    title: formatMessage({
                        id: 'global.plugins',
                        defaultMessage: 'Plugins'
                    }),
                    subtitle: formatMessage({
                        id: 'app.components.ListPluginsPage.description',
                        defaultMessage: 'List of the installed plugins in the project.'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Layout.Layouts.Content, {
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
                        colCount: 2,
                        rowCount: data?.plugins?.length ?? 0 + 1,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "sigma",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'global.name',
                                                    defaultMessage: 'Name'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "sigma",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'global.description',
                                                    defaultMessage: 'description'
                                                })
                                            })
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
                                children: data?.plugins.map(({ name, displayName, description })=>{
                                    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    textColor: "neutral800",
                                                    variant: "omega",
                                                    fontWeight: "bold",
                                                    children: formatMessage({
                                                        id: `global.plugins.${name}`,
                                                        defaultMessage: displayName
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                    textColor: "neutral800",
                                                    children: formatMessage({
                                                        id: `global.plugins.${name}.description`,
                                                        defaultMessage: description
                                                    })
                                                })
                                            })
                                        ]
                                    }, name);
                                })
                            })
                        ]
                    })
                })
            ]
        })
    });
};
const ProtectedInstalledPlugins = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions);
    return /*#__PURE__*/ jsxRuntime.jsxs(PageHelpers.Page.Protect, {
        permissions: permissions.marketplace?.main,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'global.plugins',
                    defaultMessage: 'Plugins'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(InstalledPlugins, {})
        ]
    });
};

exports.InstalledPlugins = InstalledPlugins;
exports.ProtectedInstalledPlugins = ProtectedInstalledPlugins;
//# sourceMappingURL=InstalledPlugins.js.map
