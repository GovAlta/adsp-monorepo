'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var ai = require('../../../../../services/ai.js');

const StyledProgressBar = styled.styled(designSystem.ProgressBar)`
  width: 100%;
  background-color: ${({ theme })=>theme.colors.neutral200};
  > div {
    background-color: ${({ theme })=>theme.colors.neutral700};
  }
`;
const StyledGridItem = styled.styled(designSystem.Grid.Item)`
  ${({ theme })=>theme.breakpoints.large} {
    grid-column: 7 / 13;
  }
`;
const AIUsage = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { data, isLoading, error } = ai.useGetAIUsageQuery(undefined, {
        refetchOnMountOrArgChange: true
    });
    if (isLoading) {
        return null;
    }
    if (error || !data) {
        return null;
    }
    if (!data.subscription?.cmsAiEnabled) {
        return null;
    }
    // Calculate remaining credits and total
    const totalCredits = data.subscription.cmsAiCreditsBase;
    const usedCredits = data.cmsAiCreditsUsed;
    const maxCredits = data.subscription.cmsAiCreditsMaxUsage;
    const overage = usedCredits - totalCredits;
    const percentRemaining = usedCredits / totalCredits * 100;
    const percentOverage = usedCredits / maxCredits * 100;
    const isInOverages = overage > 0 && maxCredits !== totalCredits;
    return /*#__PURE__*/ jsxRuntime.jsxs(StyledGridItem, {
        col: 6,
        s: 12,
        direction: "column",
        alignItems: "start",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "sigma",
                textColor: "neutral600",
                children: formatMessage({
                    id: 'Settings.application.ai-usage',
                    defaultMessage: 'AI Usage'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                direction: "column",
                alignItems: "flex-start",
                children: [
                    !isInOverages && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                width: "100%",
                                children: /*#__PURE__*/ jsxRuntime.jsx(StyledProgressBar, {
                                    value: percentRemaining,
                                    size: "M"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                children: `${usedCredits.toFixed(2)} credits used from ${totalCredits} credits available in your plan`
                            })
                        ]
                    }),
                    isInOverages && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                width: "100%",
                                children: /*#__PURE__*/ jsxRuntime.jsx(StyledProgressBar, {
                                    value: percentOverage,
                                    size: "M",
                                    color: "danger"
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                textColor: "danger600",
                                children: `${overage.toFixed(2)} credits used above the ${totalCredits} credits available in your plan`
                            })
                        ]
                    })
                ]
            })
        ]
    });
};

exports.AIUsage = AIUsage;
//# sourceMappingURL=AIUsage.js.map
