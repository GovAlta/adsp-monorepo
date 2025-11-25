'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var ContentBox = require('../../../../components/ContentBox.js');
var Context = require('../../../../components/GuidedTour/Context.js');
var Tours = require('../../../../components/GuidedTour/Tours.js');
var constants = require('../../../../components/GuidedTour/utils/constants.js');
var Notifications = require('../../../../features/Notifications.js');
var Tracking = require('../../../../features/Tracking.js');
var useClipboard = require('../../../../hooks/useClipboard.js');

const TypographyWordBreak = styled.styled(designSystem.Typography)`
  word-break: break-all;
`;
const ApiTokenBox = ({ token, tokenType })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const { trackUsage } = Tracking.useTracking();
    const dispatch = Context.useGuidedTour('TokenBox', (s)=>s.dispatch);
    const { copy } = useClipboard.useClipboard();
    const handleCopyToken = async (token)=>{
        if (token) {
            const didCopy = await copy(token);
            if (didCopy) {
                trackUsage('didCopyTokenKey', {
                    tokenType
                });
                dispatch({
                    type: 'set_completed_actions',
                    payload: [
                        constants.GUIDED_TOUR_REQUIRED_ACTIONS.apiTokens.copyToken
                    ]
                });
                toggleNotification({
                    type: 'success',
                    message: formatMessage({
                        id: 'Settings.tokens.notification.copied'
                    })
                });
            }
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            shadow: "tableShadow",
            direction: "column",
            alignItems: "start",
            hasRadius: true,
            padding: 6,
            background: "neutral0",
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    direction: "column",
                    alignItems: "start",
                    gap: 1,
                    paddingBottom: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            fontWeight: "bold",
                            children: formatMessage({
                                id: 'Settings.tokens.copy.title',
                                defaultMessage: 'Token'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            children: formatMessage({
                                id: 'Settings.apiTokens.copy.lastWarning',
                                defaultMessage: 'Copy your API token'
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    background: "neutral100",
                    hasRadius: true,
                    padding: 2,
                    borderColor: "neutral150",
                    children: /*#__PURE__*/ jsxRuntime.jsx(TypographyWordBreak, {
                        fontWeight: "semiBold",
                        variant: "pi",
                        children: token
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(Tours.tours.apiTokens.CopyAPIToken, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {}),
                        variant: "secondary",
                        onClick: (e)=>{
                            e.preventDefault();
                            handleCopyToken(token);
                        },
                        marginTop: 6,
                        children: formatMessage({
                            id: 'Settings.tokens.copy.copy',
                            defaultMessage: 'Copy'
                        })
                    })
                })
            ]
        })
    });
};
const TokenBox = ({ token, tokenType })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = Notifications.useNotification();
    const { trackUsage } = Tracking.useTracking();
    const { copy } = useClipboard.useClipboard();
    const handleClick = (token)=>async ()=>{
            if (token) {
                const didCopy = await copy(token);
                if (didCopy) {
                    trackUsage('didCopyTokenKey', {
                        tokenType
                    });
                    toggleNotification({
                        type: 'success',
                        message: formatMessage({
                            id: 'Settings.tokens.notification.copied'
                        })
                    });
                }
            }
        };
    return /*#__PURE__*/ jsxRuntime.jsx(ContentBox.ContentBox, {
        endAction: token && /*#__PURE__*/ jsxRuntime.jsx("span", {
            style: {
                alignSelf: 'start'
            },
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                label: formatMessage({
                    id: 'app.component.CopyToClipboard.label',
                    defaultMessage: 'Copy to clipboard'
                }),
                onClick: handleClick(token),
                variant: "ghost",
                type: "button",
                style: {
                    padding: 0,
                    height: '1.6rem'
                },
                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {})
            })
        }),
        title: token || formatMessage({
            id: 'Settings.tokens.copy.editTitle',
            defaultMessage: 'This token isn’t accessible anymore.'
        }),
        subtitle: token ? formatMessage(tokenType === 'api-token' ? {
            id: 'Settings.tokens.copy.subtitle',
            defaultMessage: 'Copy this token for use elsewhere'
        } : {
            id: 'Settings.tokens.copy.lastWarning',
            defaultMessage: 'Make sure to copy this token, you won’t be able to see it again!'
        }) : formatMessage({
            id: 'Settings.tokens.copy.editMessage',
            defaultMessage: 'For security reasons, you can only see your token once.'
        }),
        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Key, {}),
        iconBackground: "neutral100"
    });
};

exports.ApiTokenBox = ApiTokenBox;
exports.TokenBox = TokenBox;
//# sourceMappingURL=TokenBox.js.map
