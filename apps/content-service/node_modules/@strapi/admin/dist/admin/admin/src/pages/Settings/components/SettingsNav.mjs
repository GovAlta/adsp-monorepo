import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Badge, Divider } from '@strapi/design-system';
import { Lightning } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { styled } from 'styled-components';
import { useLicenseLimits } from '../../../../../ee/admin/src/hooks/useLicenseLimits.mjs';
import { SubNav } from '../../../components/SubNav.mjs';
import { useTracking } from '../../../features/Tracking.mjs';
import { useSettingsMenu } from '../../../hooks/useSettingsMenu.mjs';

const StyledBadge = styled(Badge)`
  border-radius: 50%;
  padding: ${({ theme })=>theme.spaces[2]};
  height: 2rem;
`;
const SettingsNav = ({ isFullPage = false })=>{
    const { menu } = useSettingsMenu();
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const { pathname } = useLocation();
    const { license } = useLicenseLimits();
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
    return /*#__PURE__*/ jsxs(SubNav.Main, {
        "aria-label": label,
        children: [
            !isFullPage && /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(SubNav.Header, {
                        label: label
                    }),
                    /*#__PURE__*/ jsx(Divider, {})
                ]
            }),
            /*#__PURE__*/ jsxs(SubNav.Content, {
                children: [
                    isFullPage && /*#__PURE__*/ jsx(SubNav.Header, {
                        label: label
                    }),
                    /*#__PURE__*/ jsx(SubNav.Sections, {
                        children: sections.map((section)=>/*#__PURE__*/ jsx(SubNav.Section, {
                                label: formatMessage(section.intlLabel),
                                children: section.links.map((link)=>{
                                    return /*#__PURE__*/ jsx(SubNav.Link, {
                                        to: link.to,
                                        onClick: handleClickOnLink(link.to),
                                        label: formatMessage(link.intlLabel),
                                        endAction: /*#__PURE__*/ jsxs(Fragment, {
                                            children: [
                                                link?.licenseOnly && /*#__PURE__*/ jsx(Lightning, {
                                                    fill: (availableFeatureNames || []).includes(linksIdsToLicenseFeaturesNames[link.id]) ? 'primary600' : 'neutral300',
                                                    width: "1.5rem",
                                                    height: "1.5rem"
                                                }),
                                                link?.hasNotification && /*#__PURE__*/ jsx(StyledBadge, {
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

export { SettingsNav };
//# sourceMappingURL=SettingsNav.mjs.map
