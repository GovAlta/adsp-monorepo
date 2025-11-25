import { jsx, jsxs } from 'react/jsx-runtime';
import { Alert, Typography, Main, Flex, Link, Button } from '@strapi/design-system';
import { WarningCircle, Duplicate } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useRouteError } from 'react-router-dom';
import { styled } from 'styled-components';
import { RESPONSIVE_DEFAULT_SPACING } from '../constants/theme.mjs';
import { useClipboard } from '../hooks/useClipboard.mjs';

/**
 * @description this stops the app from going white, and instead shows the error message.
 * But it could be improved for sure.
 */ const ErrorElement = ()=>{
    const error = useRouteError();
    const { formatMessage } = useIntl();
    const { copy } = useClipboard();
    if (error instanceof Error) {
        console.error(error);
        const handleClick = async ()=>{
            await copy(`
\`\`\`
${error.stack}
\`\`\`
      `);
        };
        return /*#__PURE__*/ jsx(Main, {
            height: "100%",
            children: /*#__PURE__*/ jsx(Flex, {
                alignItems: "center",
                height: "100%",
                justifyContent: "center",
                paddingLeft: RESPONSIVE_DEFAULT_SPACING,
                paddingRight: RESPONSIVE_DEFAULT_SPACING,
                children: /*#__PURE__*/ jsxs(Flex, {
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
                        /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsx(WarningCircle, {
                                    width: "32px",
                                    height: "32px",
                                    fill: "danger600"
                                }),
                                /*#__PURE__*/ jsx(Typography, {
                                    fontSize: 4,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    children: formatMessage({
                                        id: 'app.error',
                                        defaultMessage: 'Something went wrong'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "omega",
                                    textAlign: "center",
                                    children: formatMessage({
                                        id: 'app.error.message',
                                        defaultMessage: `It seems like there is a bug in your instance, but we've got you covered. Please notify your technical team so they can investigate the source of the problem and report the issue to us by opening a bug report on {link}.`
                                    }, {
                                        link: /*#__PURE__*/ jsx(Link, {
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
                        /*#__PURE__*/ jsxs(Flex, {
                            gap: 4,
                            direction: "column",
                            width: "100%",
                            children: [
                                /*#__PURE__*/ jsx(StyledAlert, {
                                    onClose: ()=>{},
                                    width: "100%",
                                    closeLabel: "",
                                    variant: "danger",
                                    children: /*#__PURE__*/ jsx(ErrorType, {
                                        children: error.message
                                    })
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    onClick: handleClick,
                                    variant: "tertiary",
                                    startIcon: /*#__PURE__*/ jsx(Duplicate, {}),
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
const StyledAlert = styled(Alert)`
  & > div:first-child {
    display: none;
  }

  & > button {
    display: none;
  }
`;
const ErrorType = styled(Typography)`
  word-break: break-all;
  color: ${({ theme })=>theme.colors.danger600};
`;

export { ErrorElement };
//# sourceMappingURL=ErrorElement.mjs.map
