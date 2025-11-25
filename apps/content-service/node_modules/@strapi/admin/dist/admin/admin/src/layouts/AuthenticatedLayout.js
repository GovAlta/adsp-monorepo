'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var packageInfo = require('@strapi/admin/package.json');
var designSystem = require('@strapi/design-system');
var reactDnd = require('react-dnd');
var reactDndHtml5Backend = require('react-dnd-html5-backend');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var lt = require('semver/functions/lt');
var valid = require('semver/functions/valid');
var LeftMenu = require('../components/LeftMenu.js');
var NpsSurvey = require('../components/NpsSurvey.js');
var PageHelpers = require('../components/PageHelpers.js');
var PluginsInitializer = require('../components/PluginsInitializer.js');
var PrivateRoute = require('../components/PrivateRoute.js');
var UpsellBanner = require('../components/UpsellBanner.js');
var AppInfo = require('../features/AppInfo.js');
var Auth = require('../features/Auth.js');
var Configuration = require('../features/Configuration.js');
var StrapiApp = require('../features/StrapiApp.js');
var Tracking = require('../features/Tracking.js');
var useMenu = require('../hooks/useMenu.js');
var admin = require('../services/admin.js');
var users = require('../utils/users.js');

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

const { version: strapiVersion } = packageInfo;
const AdminLayout = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const userInfo = Auth.useAuth('AuthenticatedApp', (state)=>state.user);
    const [userId, setUserId] = React__namespace.useState();
    const { showReleaseNotification } = Configuration.useConfiguration('AuthenticatedApp');
    const { data: appInfo, isLoading: isLoadingAppInfo } = admin.useInformationQuery();
    const [tagName, setTagName] = React__namespace.useState(strapiVersion);
    React__namespace.useEffect(()=>{
        if (showReleaseNotification) {
            fetch('https://api.github.com/repos/strapi/strapi/releases/latest').then(async (res)=>{
                if (!res.ok) {
                    return;
                }
                const response = await res.json();
                if (!response.tag_name) {
                    throw new Error();
                }
                setTagName(response.tag_name);
            }).catch(()=>{
            /**
           * silence is golden & we'll use the strapiVersion as a fallback
           */ });
        }
    }, [
        showReleaseNotification
    ]);
    React__namespace.useEffect(()=>{
        users.hashAdminUserEmail(userInfo).then((id)=>{
            if (id) {
                setUserId(id);
            }
        });
    }, [
        userInfo
    ]);
    const { trackUsage } = Tracking.useTracking();
    const { isLoading: isLoadingMenu, generalSectionLinks, pluginsSectionLinks, topMobileNavigation, burgerMobileNavigation } = useMenu.useMenu(checkLatestStrapiVersion(strapiVersion, tagName));
    const getAllWidgets = StrapiApp.useStrapiApp('TrackingProvider', (state)=>state.widgets.getAll);
    const projectId = appInfo?.projectId;
    React__namespace.useEffect(()=>{
        if (projectId) {
            trackUsage('didAccessAuthenticatedAdministration', {
                registeredWidgets: getAllWidgets().map((widget)=>widget.uid),
                projectId
            });
        }
    }, [
        projectId,
        getAllWidgets,
        trackUsage
    ]);
    // We don't need to wait for the release query to be fetched before rendering the plugins
    // however, we need the appInfos and the permissions
    if (isLoadingMenu || isLoadingAppInfo) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(AppInfo.AppInfoProvider, {
        ...appInfo,
        userId: userId,
        latestStrapiReleaseTag: tagName,
        shouldUpdateStrapi: checkLatestStrapiVersion(strapiVersion, tagName),
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(NpsSurvey.NpsSurvey, {}),
            /*#__PURE__*/ jsxRuntime.jsx(PluginsInitializer.PluginsInitializer, {
                children: /*#__PURE__*/ jsxRuntime.jsx(reactDnd.DndProvider, {
                    backend: reactDndHtml5Backend.HTML5Backend,
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                        background: "neutral100",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.SkipToContent, {
                                children: formatMessage({
                                    id: 'skipToContent',
                                    defaultMessage: 'Skip to content'
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                height: "100dvh",
                                direction: {
                                    initial: 'column',
                                    large: 'row'
                                },
                                alignItems: "flex-start",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(LeftMenu.LeftMenu, {
                                        generalSectionLinks: generalSectionLinks,
                                        pluginsSectionLinks: pluginsSectionLinks,
                                        topMobileNavigation: topMobileNavigation,
                                        burgerMobileNavigation: burgerMobileNavigation
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                                        flex: 1,
                                        overflow: "auto",
                                        width: "100%",
                                        height: {
                                            initial: 'auto',
                                            large: '100%'
                                        },
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(UpsellBanner.UpsellBanner, {}),
                                            /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Outlet, {})
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                })
            })
        ]
    });
};
const PrivateAdminLayout = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx(PrivateRoute.PrivateRoute, {
        children: /*#__PURE__*/ jsxRuntime.jsx(AdminLayout, {})
    });
};
const checkLatestStrapiVersion = (currentPackageVersion, latestPublishedVersion = '')=>{
    if (!valid(currentPackageVersion) || !valid(latestPublishedVersion)) {
        return false;
    }
    return lt(currentPackageVersion, latestPublishedVersion);
};

exports.AdminLayout = AdminLayout;
exports.PrivateAdminLayout = PrivateAdminLayout;
//# sourceMappingURL=AuthenticatedLayout.js.map
