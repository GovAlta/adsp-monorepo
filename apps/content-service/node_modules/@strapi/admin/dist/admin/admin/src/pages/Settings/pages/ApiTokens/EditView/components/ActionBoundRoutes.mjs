import { jsx, jsxs } from 'react/jsx-runtime';
import { Grid, Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useApiTokenPermissions } from '../apiTokenPermissions.mjs';
import { BoundRoute } from './BoundRoute.mjs';

const ActionBoundRoutes = ()=>{
    const { value: { selectedAction, routes } } = useApiTokenPermissions();
    const { formatMessage } = useIntl();
    const actionSection = selectedAction?.split('.')[0];
    return /*#__PURE__*/ jsx(Grid.Item, {
        col: 5,
        background: "neutral150",
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 7,
        paddingRight: 7,
        style: {
            minHeight: '100%'
        },
        direction: "column",
        alignItems: "stretch",
        children: selectedAction ? /*#__PURE__*/ jsx(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: actionSection && actionSection in routes && routes[actionSection].map((route)=>{
                return route.config.auth?.scope?.includes(selectedAction) || route.handler === selectedAction ? /*#__PURE__*/ jsx(BoundRoute, {
                    route: route
                }, route.handler) : null;
            })
        }) : /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: [
                /*#__PURE__*/ jsx(Typography, {
                    variant: "delta",
                    tag: "h3",
                    children: formatMessage({
                        id: 'Settings.apiTokens.createPage.permissions.header.title',
                        defaultMessage: 'Advanced settings'
                    })
                }),
                /*#__PURE__*/ jsx(Typography, {
                    tag: "p",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: 'Settings.apiTokens.createPage.permissions.header.hint',
                        defaultMessage: "Select the application's actions or the plugin's actions and click on the cog icon to display the bound route"
                    })
                })
            ]
        })
    });
};

export { ActionBoundRoutes };
//# sourceMappingURL=ActionBoundRoutes.mjs.map
