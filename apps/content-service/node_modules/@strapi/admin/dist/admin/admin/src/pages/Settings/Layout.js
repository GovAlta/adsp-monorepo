'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Layout$1 = require('../../components/Layouts/Layout.js');
var PageHelpers = require('../../components/PageHelpers.js');
var SubNav = require('../../components/SubNav.js');
var theme = require('../../constants/theme.js');
var BackButton = require('../../features/BackButton.js');
var useMediaQuery = require('../../hooks/useMediaQuery.js');
var useSettingsMenu = require('../../hooks/useSettingsMenu.js');
var SettingsNav = require('./components/SettingsNav.js');

const Layout = ()=>{
    /**
   * This ensures we're capturing the settingId from the URL
   * but also lets any nesting after that pass.
   */ const match = reactRouterDom.useMatch('/settings/:settingId/*');
    const { formatMessage } = reactIntl.useIntl();
    const { isLoading } = useSettingsMenu.useSettingsMenu();
    const isMobile = useMediaQuery.useIsMobile();
    // Since the useSettingsMenu hook can make API calls in order to check the links permissions
    // We need to add a loading state to prevent redirecting the user while permissions are being checked
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
    }
    // On /settings base route
    if (!match?.params.settingId) {
        // On desktop: redirect to first settings page
        if (!isMobile) {
            return /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Navigate, {
                to: "application-infos"
            });
        }
        // On mobile: show navigation page
        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                    children: formatMessage({
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.PageWrapper, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(SettingsNav.SettingsNav, {
                        isFullPage: true
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(Layout$1.Layouts.Root, {
        sideNav: /*#__PURE__*/ jsxRuntime.jsx(SettingsNav.SettingsNav, {}),
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Title, {
                children: formatMessage({
                    id: 'global.settings',
                    defaultMessage: 'Settings'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                display: {
                    initial: 'block',
                    medium: 'none'
                },
                paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
                paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
                paddingTop: theme.RESPONSIVE_DEFAULT_SPACING,
                children: /*#__PURE__*/ jsxRuntime.jsx(BackButton.BackButton, {
                    fallback: "/settings"
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Outlet, {})
        ]
    });
};

exports.Layout = Layout;
//# sourceMappingURL=Layout.js.map
