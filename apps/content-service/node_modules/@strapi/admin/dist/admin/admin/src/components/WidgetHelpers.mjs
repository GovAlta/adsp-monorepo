import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, Loader, Typography } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { EmptyDocuments, EmptyPermissions } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';

const Loading = ({ children })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Flex, {
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        children: /*#__PURE__*/ jsx(Loader, {
            children: children ?? formatMessage({
                id: 'HomePage.widget.loading',
                defaultMessage: 'Loading widget content'
            })
        })
    });
};
const Error = ({ children })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        children: [
            /*#__PURE__*/ jsx(WarningCircle, {
                width: "3.2rem",
                height: "3.2rem",
                fill: "danger600"
            }),
            /*#__PURE__*/ jsx(Typography, {
                variant: "delta",
                children: formatMessage({
                    id: 'global.error',
                    defaultMessage: 'Something went wrong'
                })
            }),
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.error',
                    defaultMessage: "Couldn't load widget content."
                })
            })
        ]
    });
};
const NoData = ({ children })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsx(EmptyDocuments, {
                width: "16rem",
                height: "8.8rem"
            }),
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.no-data',
                    defaultMessage: 'No content found.'
                })
            })
        ]
    });
};
const NoPermissions = ({ children })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Flex, {
        height: "100%",
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        children: [
            /*#__PURE__*/ jsx(EmptyPermissions, {
                width: "16rem",
                height: "8.8rem"
            }),
            /*#__PURE__*/ jsx(Typography, {
                textColor: "neutral600",
                children: children ?? formatMessage({
                    id: 'HomePage.widget.no-permissions',
                    defaultMessage: 'You don’t have the permission to see this widget'
                })
            })
        ]
    });
};
const Widget = {
    Loading,
    Error,
    NoData,
    NoPermissions
};

export { Widget };
//# sourceMappingURL=WidgetHelpers.mjs.map
