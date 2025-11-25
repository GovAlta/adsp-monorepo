'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactContext = require('@radix-ui/react-context');
var reactIntl = require('react-intl');
var PageHelpers = require('../components/PageHelpers.js');
var hooks = require('../core/store/hooks.js');
var useAPIErrorHandler = require('../hooks/useAPIErrorHandler.js');
var useRBAC = require('../hooks/useRBAC.js');
var admin = require('../services/admin.js');
var Auth = require('./Auth.js');
var Notifications = require('./Notifications.js');
var Tracking = require('./Tracking.js');

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

const [ConfigurationContextProvider, useConfiguration] = reactContext.createContext('ConfigurationContext');
const ConfigurationProvider = ({ children, defaultAuthLogo, defaultMenuLogo, showReleaseNotification = false })=>{
    const { trackUsage } = Tracking.useTracking();
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler.useAPIErrorHandler();
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.settings?.['project-settings']);
    const token = Auth.useAuth('ConfigurationProvider', (state)=>state.token);
    const { allowedActions: { canRead } } = useRBAC.useRBAC(permissions);
    const { data: { authLogo: customAuthLogo, menuLogo: customMenuLogo } = {}, error, isLoading } = admin.useInitQuery();
    React__namespace.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'app.containers.App.notification.error.init'
                })
            });
        }
    }, [
        error,
        formatMessage,
        toggleNotification
    ]);
    const { data, isSuccess } = admin.useProjectSettingsQuery(undefined, {
        skip: !token || !canRead
    });
    const [updateProjectSettingsMutation] = admin.useUpdateProjectSettingsMutation();
    const updateProjectSettings = React__namespace.useCallback(async (body)=>{
        const formData = new FormData();
        /**
       * We either only send files or we send null values.
       * Null removes the logo. If you don't want to effect
       * an existing logo, don't send anything.
       */ Object.entries(body).forEach(([key, value])=>{
            if (value?.rawFile) {
                formData.append(key, value.rawFile);
            } else if (value === null) {
                formData.append(key, JSON.stringify(value));
            }
        });
        const res = await updateProjectSettingsMutation(formData);
        if ('data' in res) {
            const updatedMenuLogo = !!res.data.menuLogo && !!body.menuLogo?.rawFile;
            const updatedAuthLogo = !!res.data.authLogo && !!body.authLogo?.rawFile;
            if (updatedMenuLogo) {
                trackUsage('didChangeLogo', {
                    logo: 'menu'
                });
            }
            if (updatedAuthLogo) {
                trackUsage('didChangeLogo', {
                    logo: 'auth'
                });
            }
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'app',
                    defaultMessage: 'Saved'
                })
            });
        } else {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
        }
    }, [
        formatAPIError,
        formatMessage,
        toggleNotification,
        trackUsage,
        updateProjectSettingsMutation
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsx(ConfigurationContextProvider, {
        showReleaseNotification: showReleaseNotification,
        logos: {
            menu: {
                custom: isSuccess ? data?.menuLogo : {
                    url: customMenuLogo ?? ''
                },
                default: defaultMenuLogo
            },
            auth: {
                custom: isSuccess ? data?.authLogo : {
                    url: customAuthLogo ?? ''
                },
                default: defaultAuthLogo
            }
        },
        updateProjectSettings: updateProjectSettings,
        children: children
    });
};

exports.ConfigurationProvider = ConfigurationProvider;
exports._internalConfigurationContextProvider = ConfigurationContextProvider;
exports.useConfiguration = useConfiguration;
//# sourceMappingURL=Configuration.js.map
