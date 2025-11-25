'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var ee = require('@strapi/admin/strapi-admin/ee');
var designSystem = require('@strapi/design-system');
var dateFns = require('date-fns');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var admin = require('../services/admin.js');
var theme = require('../constants/theme.js');
var usePersistentState = require('../hooks/usePersistentState.js');

const BannerBackground = styled.styled(designSystem.Flex)`
  background: linear-gradient(
    90deg,
    ${({ theme })=>theme.colors.primary600} 0%,
    ${({ theme })=>theme.colors.alternative600} 121.48%
  );
`;
const Banner = ({ isTrialEndedRecently })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(BannerBackground, {
        width: "100%",
        justifyContent: "center",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
            paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "delta",
                            fontWeight: "bold",
                            textColor: "neutral0",
                            textAlign: "center",
                            fontSize: 2,
                            children: formatMessage(isTrialEndedRecently ? {
                                id: 'app.components.UpsellBanner.intro.ended',
                                defaultMessage: 'Your trial has ended: '
                            } : {
                                id: 'app.components.UpsellBanner.intro',
                                defaultMessage: 'Access to Growth plan features: '
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            variant: "delta",
                            textColor: "neutral0",
                            textAlign: "center",
                            paddingRight: 4,
                            fontSize: 2,
                            children: formatMessage(isTrialEndedRecently ? {
                                id: 'app.components.UpsellBanner.text.ended',
                                defaultMessage: 'Keep access to Growth features by upgrading now.'
                            } : {
                                id: 'app.components.UpsellBanner.text',
                                defaultMessage: 'As part of your trial, you can explore premium tools such as Content History, Releases, and Single Sign-On (SSO).'
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                        width: "max-content",
                        variant: "tertiary",
                        href: "https://strapi.chargebeeportal.com",
                        target: "_blank",
                        children: formatMessage(isTrialEndedRecently ? {
                            id: 'app.components.UpsellBanner.button.ended',
                            defaultMessage: 'Keep Growth plan'
                        } : {
                            id: 'app.components.UpsellBanner.button',
                            defaultMessage: 'Upgrade now'
                        })
                    })
                })
            ]
        })
    });
};
const UpsellBanner = ()=>{
    const { license } = ee.useLicenseLimits();
    const [cachedTrialEndsAt, setCachedTrialEndsAt] = usePersistentState.useScopedPersistentState('STRAPI_FREE_TRIAL_ENDS_AT', undefined);
    const sevenDaysAgo = dateFns.subDays(new Date(), 7);
    const timeLeftData = admin.useGetLicenseTrialTimeLeftQuery(undefined, {
        skip: !license?.isTrial
    });
    React.useEffect(()=>{
        if (timeLeftData.data?.trialEndsAt) {
            setCachedTrialEndsAt(timeLeftData.data.trialEndsAt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        timeLeftData.data?.trialEndsAt
    ]);
    // When the license is not a trial + not EE, and the cached trial end date is found in the localstorage, that means the trial has ended
    // We show the banner to encourage the user to upgrade (for 7 days after the trial ends)
    const isTrialEndedRecently = Boolean(!license?.isTrial && !window.strapi.isEE && cachedTrialEndsAt && dateFns.isAfter(new Date(cachedTrialEndsAt), sevenDaysAgo));
    if (timeLeftData.data?.trialEndsAt || isTrialEndedRecently) {
        return /*#__PURE__*/ jsxRuntime.jsx(Banner, {
            isTrialEndedRecently: isTrialEndedRecently
        });
    }
    return null;
};

exports.UpsellBanner = UpsellBanner;
//# sourceMappingURL=UpsellBanner.js.map
