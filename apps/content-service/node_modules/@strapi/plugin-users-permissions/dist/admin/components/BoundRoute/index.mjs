import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import map from 'lodash/map';
import tail from 'lodash/tail';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import getMethodColor from './getMethodColor.mjs';

const MethodBox = styled(Box)`
  margin: -1px;
  border-radius: ${({ theme })=>theme.spaces[1]} 0 0 ${({ theme })=>theme.spaces[1]};
`;
function BoundRoute({ route }) {
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
                        id: 'users-permissions.BoundRoute.title',
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
}
BoundRoute.defaultProps = {
    route: {
        handler: 'Nocontroller.error',
        method: 'GET',
        path: '/there-is-no-path'
    }
};
BoundRoute.propTypes = {
    route: PropTypes.shape({
        handler: PropTypes.string,
        method: PropTypes.string,
        path: PropTypes.string
    })
};

export { BoundRoute as default };
//# sourceMappingURL=index.mjs.map
