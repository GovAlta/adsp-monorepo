'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var useLicenseLimits = require('../../../../../ee/admin/src/hooks/useLicenseLimits.js');
var SubNav = require('../../../components/SubNav.js');
var Tracking = require('../../../features/Tracking.js');
var useSettingsMenu = require('../../../hooks/useSettingsMenu.js');

const StyledBadge = styled.styled(designSystem.Badge)`
  border-radius: 50%;
  padding: ${({ theme })=>theme.spaces[2]};
  height: 2rem;
`;
const SettingsNav = ({ isFullPage = false })=>{
    const { menu } = useSettingsMenu.useSettingsMenu();
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const { pathname } = reactRouterDom.useLocation();
    const { license } = useLicenseLimits.useLicenseLimits();
    const availableFeatureNames = license?.features.map((feature)=>feature.name);
    const linksIdsToLicenseFeaturesNames = {
        'content-releases': 'cms-content-releases',
        'review-workflows': 'review-workflows',
        sso: 'sso',
        auditLogs: 'audit-logs',
        'auditLogs-purchase-page': 'audit-logs'
    };
    const filteredMenu = menu.filter((section)=>!section.links.every((link)=>link.isDisplayed === false));
    const sections = filteredMenu.map((section)=>{
        return {
            ...section,
            title: section.intlLabel,
            links: section.links.map((link)=>{
                return {
                    ...link,
                    id: link.id,
                    title: link.intlLabel,
                    name: link.id,
                    to: link.to.startsWith('/') ? link.to : `/settings/${link.to}`
                };
            })
        };
    });
    const label = formatMessage({
        id: 'global.settings',
        defaultMessage: 'Settings'
    });
    const handleClickOnLink = (destination)=>()=>{
            trackUsage('willNavigate', {
                from: pathname,
                to: destination
            });
        };
    return /*#__PURE__*/ jsxRuntime.jsxs(SubNav.SubNav.Main, {
        "aria-label": label,
        children: [
            !isFullPage && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.Header, {
                        label: label
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {})
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(SubNav.SubNav.Content, {
                children: [
                    isFullPage && /*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.Header, {
                        label: label
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.Sections, {
                        children: sections.map((section)=>/*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.Section, {
                                label: formatMessage(section.intlLabel),
                                children: section.links.map((link)=>{
                                    return /*#__PURE__*/ jsxRuntime.jsx(SubNav.SubNav.Link, {
                                        to: link.to,
                                        onClick: handleClickOnLink(link.to),
                                        label: formatMessage(link.intlLabel),
                                        endAction: /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                                            children: [
                                                link?.licenseOnly && /*#__PURE__*/ jsxRuntime.jsx(icons.Lightning, {
                                                    fill: (availableFeatureNames || []).includes(linksIdsToLicenseFeaturesNames[link.id]) ? 'primary600' : 'neutral300',
                                                    width: "1.5rem",
                                                    height: "1.5rem"
                                                }),
                                                link?.hasNotification && /*#__PURE__*/ jsxRuntime.jsx(StyledBadge, {
                                                    "aria-label": "Notification",
                                                    backgroundColor: "primary600",
                                                    textColor: "neutral0",
                                                    children: "1"
                                                })
                                            ]
                                        }),
                                        children: formatMessage(link.intlLabel)
                                    }, link.id);
                                })
                            }, section.id))
                    })
                ]
            })
        ]
    });
};

exports.SettingsNav = SettingsNav;
//# sourceMappingURL=SettingsNav.js.map
