'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRedux = require('react-redux');
var useRBAC = require('../../../../../../../../admin/src/hooks/useRBAC.js');
var selectors = require('../../../../../../../../admin/src/selectors.js');
var useLicenseLimits = require('../../../../../hooks/useLicenseLimits.js');

const BILLING_SELF_HOSTED_URL = 'https://strapi.io/billing/request-seats';
const MANAGE_SEATS_URL = 'https://strapi.io/billing/manage-seats';
const AdminSeatInfoEE = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const { settings } = reactRedux.useSelector(selectors.selectAdminPermissions);
    const { isLoading: isRBACLoading, allowedActions: { canRead, canCreate, canUpdate, canDelete } } = useRBAC.useRBAC(settings?.users ?? {});
    const { license, isError, isLoading: isLicenseLoading } = useLicenseLimits.useLicenseLimits({
        // TODO: this creates a waterfall which we should avoid to render earlier, but for that
        // we will have to move away from data-fetching hooks to query functions.
        // Short-term we could at least implement a loader, for the user to have visual feedback
        // in case the requests take a while
        enabled: !isRBACLoading && canRead && canCreate && canUpdate && canDelete
    });
    const isLoading = isRBACLoading || isLicenseLoading;
    if (isError || isLoading || !license) {
        return null;
    }
    const { licenseLimitStatus, enforcementUserCount, permittedSeats, type } = license;
    if (!permittedSeats) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Item, {
        col: 6,
        s: 12,
        direction: "column",
        alignItems: "stretch",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                variant: "sigma",
                textColor: "neutral600",
                children: formatMessage({
                    id: 'Settings.application.admin-seats',
                    defaultMessage: 'Admin seats'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            tag: "p",
                            children: formatMessage({
                                id: 'Settings.application.ee.admin-seats.count',
                                defaultMessage: '<text>{enforcementUserCount}</text>/{permittedSeats}'
                            }, {
                                permittedSeats,
                                enforcementUserCount,
                                text: (chunks)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        fontWeight: "semiBold",
                                        textColor: enforcementUserCount > permittedSeats ? 'danger500' : undefined,
                                        children: chunks
                                    })
                            })
                        })
                    }),
                    licenseLimitStatus === 'OVER_LIMIT' && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tooltip, {
                        label: formatMessage({
                            id: 'Settings.application.ee.admin-seats.at-limit-tooltip',
                            defaultMessage: 'At limit: add seats to invite more users'
                        }),
                        children: /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                            width: "1.4rem",
                            height: "1.4rem",
                            fill: "danger500"
                        })
                    })
                ]
            }),
            type === 'gold' ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                href: BILLING_SELF_HOSTED_URL,
                endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                children: formatMessage({
                    id: 'Settings.application.ee.admin-seats.support',
                    defaultMessage: 'Contact sales'
                })
            }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                href: MANAGE_SEATS_URL,
                isExternal: true,
                endIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ExternalLink, {}),
                children: formatMessage({
                    id: 'Settings.application.ee.admin-seats.add-seats',
                    defaultMessage: 'Manage seats'
                })
            })
        ]
    });
};

exports.AdminSeatInfoEE = AdminSeatInfoEE;
//# sourceMappingURL=AdminSeatInfo.js.map
