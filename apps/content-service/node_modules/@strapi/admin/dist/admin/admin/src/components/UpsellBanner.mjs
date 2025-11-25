import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect } from 'react';
import { useLicenseLimits } from '@strapi/admin/strapi-admin/ee';
import { Flex, Box, Typography, LinkButton } from '@strapi/design-system';
import { subDays, isAfter } from 'date-fns';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useGetLicenseTrialTimeLeftQuery } from '../services/admin.mjs';
import { RESPONSIVE_DEFAULT_SPACING } from '../constants/theme.mjs';
import { useScopedPersistentState } from '../hooks/usePersistentState.mjs';

const BannerBackground = styled(Flex)`
  background: linear-gradient(
    90deg,
    ${({ theme })=>theme.colors.primary600} 0%,
    ${({ theme })=>theme.colors.alternative600} 121.48%
  );
`;
const Banner = ({ isTrialEndedRecently })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(BannerBackground, {
        width: "100%",
        justifyContent: "center",
        children: /*#__PURE__*/ jsxs(Flex, {
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            paddingTop: 2,
            paddingBottom: 2,
            paddingLeft: RESPONSIVE_DEFAULT_SPACING,
            paddingRight: RESPONSIVE_DEFAULT_SPACING,
            gap: 2,
            children: [
                /*#__PURE__*/ jsxs(Box, {
                    children: [
                        /*#__PURE__*/ jsx(Typography, {
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
                        /*#__PURE__*/ jsx(Typography, {
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
                /*#__PURE__*/ jsx(Box, {
                    children: /*#__PURE__*/ jsx(LinkButton, {
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
    const { license } = useLicenseLimits();
    const [cachedTrialEndsAt, setCachedTrialEndsAt] = useScopedPersistentState('STRAPI_FREE_TRIAL_ENDS_AT', undefined);
    const sevenDaysAgo = subDays(new Date(), 7);
    const timeLeftData = useGetLicenseTrialTimeLeftQuery(undefined, {
        skip: !license?.isTrial
    });
    useEffect(()=>{
        if (timeLeftData.data?.trialEndsAt) {
            setCachedTrialEndsAt(timeLeftData.data.trialEndsAt);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        timeLeftData.data?.trialEndsAt
    ]);
    // When the license is not a trial + not EE, and the cached trial end date is found in the localstorage, that means the trial has ended
    // We show the banner to encourage the user to upgrade (for 7 days after the trial ends)
    const isTrialEndedRecently = Boolean(!license?.isTrial && !window.strapi.isEE && cachedTrialEndsAt && isAfter(new Date(cachedTrialEndsAt), sevenDaysAgo));
    if (timeLeftData.data?.trialEndsAt || isTrialEndedRecently) {
        return /*#__PURE__*/ jsx(Banner, {
            isTrialEndedRecently: isTrialEndedRecently
        });
    }
    return null;
};

export { UpsellBanner };
//# sourceMappingURL=UpsellBanner.mjs.map
