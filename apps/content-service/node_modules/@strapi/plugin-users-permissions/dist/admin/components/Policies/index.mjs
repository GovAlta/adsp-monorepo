import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Grid, Flex, Typography } from '@strapi/design-system';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import without from 'lodash/without';
import { useIntl } from 'react-intl';
import { useUsersPermissions } from '../../contexts/UsersPermissionsContext/index.mjs';
import BoundRoute from '../BoundRoute/index.mjs';

const Policies = ()=>{
    const { formatMessage } = useIntl();
    const { selectedAction, routes } = useUsersPermissions();
    const path = without(selectedAction.split('.'), 'controllers');
    const controllerRoutes = get(routes, path[0]);
    const pathResolved = path.slice(1).join('.');
    const displayedRoutes = isEmpty(controllerRoutes) ? [] : controllerRoutes.filter((o)=>o.handler.endsWith(pathResolved));
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
            children: displayedRoutes.map((route, key)=>// eslint-disable-next-line react/no-array-index-key
                /*#__PURE__*/ jsx(BoundRoute, {
                    route: route
                }, key))
        }) : /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 2,
            children: [
                /*#__PURE__*/ jsx(Typography, {
                    variant: "delta",
                    tag: "h3",
                    children: formatMessage({
                        id: 'users-permissions.Policies.header.title',
                        defaultMessage: 'Advanced settings'
                    })
                }),
                /*#__PURE__*/ jsx(Typography, {
                    tag: "p",
                    textColor: "neutral600",
                    children: formatMessage({
                        id: 'users-permissions.Policies.header.hint',
                        defaultMessage: "Select the application's actions or the plugin's actions and click on the cog icon to display the bound route"
                    })
                })
            ]
        })
    });
};

export { Policies as default };
//# sourceMappingURL=index.mjs.map
