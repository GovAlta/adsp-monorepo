'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var theme = require('../constants/theme.js');
var useClipboard = require('../hooks/useClipboard.js');

/**
 * @description this stops the app from going white, and instead shows the error message.
 * But it could be improved for sure.
 */ const ErrorElement = ()=>{
    const error = reactRouterDom.useRouteError();
    const { formatMessage } = reactIntl.useIntl();
    const { copy } = useClipboard.useClipboard();
    if (error instanceof Error) {
        console.error(error);
        const handleClick = async ()=>{
            await copy(`
\`\`\`
${error.stack}
\`\`\`
      `);
        };
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Main, {
            height: "100%",
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                alignItems: "center",
                height: "100%",
                justifyContent: "center",
                paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
                paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    gap: 7,
                    padding: {
                        initial: 6,
                        small: 7,
                        medium: 8
                    },
                    direction: "column",
                    width: "100%",
                    maxWidth: "512px",
                    shadow: "tableShadow",
                    borderColor: "neutral150",
                    background: "neutral0",
                    hasRadius: true,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                                    width: "32px",
                                    height: "32px",
                                    fill: "danger600"
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    fontSize: 4,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    children: formatMessage({
                                        id: 'app.error',
                                        defaultMessage: 'Something went wrong'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    variant: "omega",
                                    textAlign: "center",
                                    children: formatMessage({
                                        id: 'app.error.message',
                                        defaultMessage: `It seems like there is a bug in your instance, but we've got you covered. Please notify your technical team so they can investigate the source of the problem and report the issue to us by opening a bug report on {link}.`
                                    }, {
                                        link: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                                            isExternal: true,
                                            // hack to get rid of the current endIcon, which should be removable by using `null`.
                                            endIcon: true,
                                            href: "https://github.com/strapi/strapi/issues/new?assignees=&labels=&projects=&template=BUG_REPORT.md",
                                            children: `Strapi's GitHub`
                                        })
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            gap: 4,
                            direction: "column",
                            width: "100%",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(StyledAlert, {
                                    onClose: ()=>{},
                                    width: "100%",
                                    closeLabel: "",
                                    variant: "danger",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(ErrorType, {
                                        children: error.message
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    onClick: handleClick,
                                    variant: "tertiary",
                                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {}),
                                    children: formatMessage({
                                        id: 'app.error.copy',
                                        defaultMessage: 'Copy to clipboard'
                                    })
                                })
                            ]
                        })
                    ]
                })
            })
        });
    }
    throw error;
};
const StyledAlert = styled.styled(designSystem.Alert)`
  & > div:first-child {
    display: none;
  }

  & > button {
    display: none;
  }
`;
const ErrorType = styled.styled(designSystem.Typography)`
  word-break: break-all;
  color: ${({ theme })=>theme.colors.danger600};
`;

exports.ErrorElement = ErrorElement;
//# sourceMappingURL=ErrorElement.js.map
