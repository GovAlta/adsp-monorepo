import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import packageInfo from '@strapi/admin/package.json';
import { Box, SkipToContent, Flex } from '@strapi/design-system';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useIntl } from 'react-intl';
import { Outlet } from 'react-router-dom';
import lt from 'semver/functions/lt';
import valid from 'semver/functions/valid';
import { LeftMenu } from '../components/LeftMenu.mjs';
import { NpsSurvey } from '../components/NpsSurvey.mjs';
import { Page } from '../components/PageHelpers.mjs';
import { PluginsInitializer } from '../components/PluginsInitializer.mjs';
import { PrivateRoute } from '../components/PrivateRoute.mjs';
import { UpsellBanner } from '../components/UpsellBanner.mjs';
import { AppInfoProvider } from '../features/AppInfo.mjs';
import { useAuth } from '../features/Auth.mjs';
import { useConfiguration } from '../features/Configuration.mjs';
import { useStrapiApp } from '../features/StrapiApp.mjs';
import { useTracking } from '../features/Tracking.mjs';
import { useMenu } from '../hooks/useMenu.mjs';
import { useInformationQuery } from '../services/admin.mjs';
import { hashAdminUserEmail } from '../utils/users.mjs';

const { version: strapiVersion } = packageInfo;
const AdminLayout = ()=>{
    const { formatMessage } = useIntl();
    const userInfo = useAuth('AuthenticatedApp', (state)=>state.user);
    const [userId, setUserId] = React.useState();
    const { showReleaseNotification } = useConfiguration('AuthenticatedApp');
    const { data: appInfo, isLoading: isLoadingAppInfo } = useInformationQuery();
    const [tagName, setTagName] = React.useState(strapiVersion);
    React.useEffect(()=>{
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
    React.useEffect(()=>{
        hashAdminUserEmail(userInfo).then((id)=>{
            if (id) {
                setUserId(id);
            }
        });
    }, [
        userInfo
    ]);
    const { trackUsage } = useTracking();
    const { isLoading: isLoadingMenu, generalSectionLinks, pluginsSectionLinks, topMobileNavigation, burgerMobileNavigation } = useMenu(checkLatestStrapiVersion(strapiVersion, tagName));
    const getAllWidgets = useStrapiApp('TrackingProvider', (state)=>state.widgets.getAll);
    const projectId = appInfo?.projectId;
    React.useEffect(()=>{
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
        return /*#__PURE__*/ jsx(Page.Loading, {});
    }
    return /*#__PURE__*/ jsxs(AppInfoProvider, {
        ...appInfo,
        userId: userId,
        latestStrapiReleaseTag: tagName,
        shouldUpdateStrapi: checkLatestStrapiVersion(strapiVersion, tagName),
        children: [
            /*#__PURE__*/ jsx(NpsSurvey, {}),
            /*#__PURE__*/ jsx(PluginsInitializer, {
                children: /*#__PURE__*/ jsx(DndProvider, {
                    backend: HTML5Backend,
                    children: /*#__PURE__*/ jsxs(Box, {
                        background: "neutral100",
                        children: [
                            /*#__PURE__*/ jsx(SkipToContent, {
                                children: formatMessage({
                                    id: 'skipToContent',
                                    defaultMessage: 'Skip to content'
                                })
                            }),
                            /*#__PURE__*/ jsxs(Flex, {
                                height: "100dvh",
                                direction: {
                                    initial: 'column',
                                    large: 'row'
                                },
                                alignItems: "flex-start",
                                children: [
                                    /*#__PURE__*/ jsx(LeftMenu, {
                                        generalSectionLinks: generalSectionLinks,
                                        pluginsSectionLinks: pluginsSectionLinks,
                                        topMobileNavigation: topMobileNavigation,
                                        burgerMobileNavigation: burgerMobileNavigation
                                    }),
                                    /*#__PURE__*/ jsxs(Box, {
                                        flex: 1,
                                        overflow: "auto",
                                        width: "100%",
                                        height: {
                                            initial: 'auto',
                                            large: '100%'
                                        },
                                        children: [
                                            /*#__PURE__*/ jsx(UpsellBanner, {}),
                                            /*#__PURE__*/ jsx(Outlet, {})
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
    return /*#__PURE__*/ jsx(PrivateRoute, {
        children: /*#__PURE__*/ jsx(AdminLayout, {})
    });
};
const checkLatestStrapiVersion = (currentPackageVersion, latestPublishedVersion = '')=>{
    if (!valid(currentPackageVersion) || !valid(latestPublishedVersion)) {
        return false;
    }
    return lt(currentPackageVersion, latestPublishedVersion);
};

export { AdminLayout, PrivateAdminLayout };
//# sourceMappingURL=AuthenticatedLayout.mjs.map
