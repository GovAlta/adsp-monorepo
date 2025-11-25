import { jsxs, jsx } from 'react/jsx-runtime';
import { Grid, Flex, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useApiTokenPermissions } from '../apiTokenPermissions.mjs';
import { ActionBoundRoutes } from './ActionBoundRoutes.mjs';
import { ContentTypesSection } from './ContentTypesSection.mjs';

const Permissions = ({ ...props })=>{
    const { value: { data } } = useApiTokenPermissions();
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Grid.Root, {
        gap: 0,
        shadow: "filterShadow",
        hasRadius: true,
        background: "neutral0",
        children: [
            /*#__PURE__*/ jsxs(Grid.Item, {
                col: 7,
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 7,
                paddingRight: 7,
                direction: "column",
                alignItems: "stretch",
                gap: 6,
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        direction: "column",
                        alignItems: "stretch",
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                variant: "delta",
                                tag: "h2",
                                children: formatMessage({
                                    id: 'Settings.apiTokens.createPage.permissions.title',
                                    defaultMessage: 'Permissions'
                                })
                            }),
                            /*#__PURE__*/ jsx(Typography, {
                                tag: "p",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: 'Settings.apiTokens.createPage.permissions.description',
                                    defaultMessage: 'Only actions bound by a route are listed below.'
                                })
                            })
                        ]
                    }),
                    data?.permissions && /*#__PURE__*/ jsx(ContentTypesSection, {
                        section: data?.permissions,
                        ...props
                    })
                ]
            }),
            /*#__PURE__*/ jsx(ActionBoundRoutes, {})
        ]
    });
};

export { Permissions };
//# sourceMappingURL=Permissions.mjs.map
