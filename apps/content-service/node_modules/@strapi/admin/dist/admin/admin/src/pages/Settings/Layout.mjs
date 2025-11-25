import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Box } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useMatch, Navigate, Outlet } from 'react-router-dom';
import { Layouts } from '../../components/Layouts/Layout.mjs';
import { Page } from '../../components/PageHelpers.mjs';
import { SubNav } from '../../components/SubNav.mjs';
import { RESPONSIVE_DEFAULT_SPACING } from '../../constants/theme.mjs';
import { BackButton } from '../../features/BackButton.mjs';
import { useIsMobile } from '../../hooks/useMediaQuery.mjs';
import { useSettingsMenu } from '../../hooks/useSettingsMenu.mjs';
import { SettingsNav } from './components/SettingsNav.mjs';

const Layout = ()=>{
    /**
   * This ensures we're capturing the settingId from the URL
   * but also lets any nesting after that pass.
   */ const match = useMatch('/settings/:settingId/*');
    const { formatMessage } = useIntl();
    const { isLoading } = useSettingsMenu();
    const isMobile = useIsMobile();
    // Since the useSettingsMenu hook can make API calls in order to check the links permissions
    // We need to add a loading state to prevent redirecting the user while permissions are being checked
    if (isLoading) {
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    // On /settings base route
    if (!match?.params.settingId) {
        // On desktop: redirect to first settings page
        if (!isMobile) {
            return /*#__PURE__*/ jsx(Navigate, {
                to: "application-infos"
            });
        }
        // On mobile: show navigation page
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Page.Title, {
                    children: formatMessage({
                        id: 'global.settings',
                        defaultMessage: 'Settings'
                    })
                }),
                /*#__PURE__*/ jsx(SubNav.PageWrapper, {
                    children: /*#__PURE__*/ jsx(SettingsNav, {
                        isFullPage: true
                    })
                })
            ]
        });
    }
    return /*#__PURE__*/ jsxs(Layouts.Root, {
        sideNav: /*#__PURE__*/ jsx(SettingsNav, {}),
        children: [
            /*#__PURE__*/ jsx(Page.Title, {
                children: formatMessage({
                    id: 'global.settings',
                    defaultMessage: 'Settings'
                })
            }),
            /*#__PURE__*/ jsx(Box, {
                display: {
                    initial: 'block',
                    medium: 'none'
                },
                paddingLeft: RESPONSIVE_DEFAULT_SPACING,
                paddingRight: RESPONSIVE_DEFAULT_SPACING,
                paddingTop: RESPONSIVE_DEFAULT_SPACING,
                children: /*#__PURE__*/ jsx(BackButton, {
                    fallback: "/settings"
                })
            }),
            /*#__PURE__*/ jsx(Outlet, {})
        ]
    });
};

export { Layout };
//# sourceMappingURL=Layout.mjs.map
