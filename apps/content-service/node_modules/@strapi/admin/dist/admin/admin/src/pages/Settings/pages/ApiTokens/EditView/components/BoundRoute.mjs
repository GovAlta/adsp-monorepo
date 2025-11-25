import { jsxs, jsx } from 'react/jsx-runtime';
import { Box, Flex, Typography } from '@strapi/design-system';
import map from 'lodash/map';
import tail from 'lodash/tail';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';

const getMethodColor = (verb)=>{
    switch(verb){
        case 'POST':
            {
                return {
                    text: 'success600',
                    border: 'success200',
                    background: 'success100'
                };
            }
        case 'GET':
            {
                return {
                    text: 'secondary600',
                    border: 'secondary200',
                    background: 'secondary100'
                };
            }
        case 'PUT':
            {
                return {
                    text: 'warning600',
                    border: 'warning200',
                    background: 'warning100'
                };
            }
        case 'DELETE':
            {
                return {
                    text: 'danger600',
                    border: 'danger200',
                    background: 'danger100'
                };
            }
        default:
            {
                return {
                    text: 'neutral600',
                    border: 'neutral200',
                    background: 'neutral100'
                };
            }
    }
};
const MethodBox = styled(Box)`
  margin: -1px;
  border-radius: ${({ theme })=>theme.spaces[1]} 0 0 ${({ theme })=>theme.spaces[1]};
`;
const BoundRoute = ({ route = {
    handler: 'Nocontroller.error',
    method: 'GET',
    path: '/there-is-no-path'
} })=>{
    const { formatMessage } = useIntl();
    const { method, handler: title, path } = route;
    const formattedRoute = path ? tail(path.split('/')) : [];
    const [controller = '', action = ''] = title ? title.split('.') : [];
    const colors = getMethodColor(route.method);
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 2,
        children: [
            /*#__PURE__*/ jsxs(Typography, {
                variant: "delta",
                tag: "h3",
                children: [
                    formatMessage({
                        id: 'Settings.apiTokens.createPage.BoundRoute.title',
                        defaultMessage: 'Bound route to'
                    }),
                    " ",
                    /*#__PURE__*/ jsx("span", {
                        children: controller
                    }),
                    /*#__PURE__*/ jsxs(Typography, {
                        variant: "delta",
                        textColor: "primary600",
                        children: [
                            ".",
                            action
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Flex, {
                hasRadius: true,
                background: "neutral0",
                borderColor: "neutral200",
                gap: 0,
                children: [
                    /*#__PURE__*/ jsx(MethodBox, {
                        background: colors.background,
                        borderColor: colors.border,
                        padding: 2,
                        children: /*#__PURE__*/ jsx(Typography, {
                            fontWeight: "bold",
                            textColor: colors.text,
                            children: method
                        })
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        paddingLeft: 2,
                        paddingRight: 2,
                        children: map(formattedRoute, (value)=>/*#__PURE__*/ jsxs(Typography, {
                                textColor: value.includes(':') ? 'neutral600' : 'neutral900',
                                children: [
                                    "/",
                                    value
                                ]
                            }, value))
                    })
                ]
            })
        ]
    });
};

export { BoundRoute };
//# sourceMappingURL=BoundRoute.mjs.map
