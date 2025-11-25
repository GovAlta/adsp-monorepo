import { jsxs, jsx } from 'react/jsx-runtime';
import { Grid, Typography, Flex, Tooltip, Link } from '@strapi/design-system';
import { WarningCircle, ExternalLink } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useRBAC } from '../../../../../../../../admin/src/hooks/useRBAC.mjs';
import { selectAdminPermissions } from '../../../../../../../../admin/src/selectors.mjs';
import { useLicenseLimits } from '../../../../../hooks/useLicenseLimits.mjs';

const BILLING_SELF_HOSTED_URL = 'https://strapi.io/billing/request-seats';
const MANAGE_SEATS_URL = 'https://strapi.io/billing/manage-seats';
const AdminSeatInfoEE = ()=>{
    const { formatMessage } = useIntl();
    const { settings } = useSelector(selectAdminPermissions);
    const { isLoading: isRBACLoading, allowedActions: { canRead, canCreate, canUpdate, canDelete } } = useRBAC(settings?.users ?? {});
    const { license, isError, isLoading: isLicenseLoading } = useLicenseLimits({
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
    return /*#__PURE__*/ jsxs(Grid.Item, {
        col: 6,
        s: 12,
        direction: "column",
        alignItems: "stretch",
        children: [
            /*#__PURE__*/ jsx(Typography, {
                variant: "sigma",
                textColor: "neutral600",
                children: formatMessage({
                    id: 'Settings.application.admin-seats',
                    defaultMessage: 'Admin seats'
                })
            }),
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(Flex, {
                        children: /*#__PURE__*/ jsx(Typography, {
                            tag: "p",
                            children: formatMessage({
                                id: 'Settings.application.ee.admin-seats.count',
                                defaultMessage: '<text>{enforcementUserCount}</text>/{permittedSeats}'
                            }, {
                                permittedSeats,
                                enforcementUserCount,
                                text: (chunks)=>/*#__PURE__*/ jsx(Typography, {
                                        fontWeight: "semiBold",
                                        textColor: enforcementUserCount > permittedSeats ? 'danger500' : undefined,
                                        children: chunks
                                    })
                            })
                        })
                    }),
                    licenseLimitStatus === 'OVER_LIMIT' && /*#__PURE__*/ jsx(Tooltip, {
                        label: formatMessage({
                            id: 'Settings.application.ee.admin-seats.at-limit-tooltip',
                            defaultMessage: 'At limit: add seats to invite more users'
                        }),
                        children: /*#__PURE__*/ jsx(WarningCircle, {
                            width: "1.4rem",
                            height: "1.4rem",
                            fill: "danger500"
                        })
                    })
                ]
            }),
            type === 'gold' ? /*#__PURE__*/ jsx(Link, {
                href: BILLING_SELF_HOSTED_URL,
                endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
                children: formatMessage({
                    id: 'Settings.application.ee.admin-seats.support',
                    defaultMessage: 'Contact sales'
                })
            }) : /*#__PURE__*/ jsx(Link, {
                href: MANAGE_SEATS_URL,
                isExternal: true,
                endIcon: /*#__PURE__*/ jsx(ExternalLink, {}),
                children: formatMessage({
                    id: 'Settings.application.ee.admin-seats.add-seats',
                    defaultMessage: 'Manage seats'
                })
            })
        ]
    });
};

export { AdminSeatInfoEE };
//# sourceMappingURL=AdminSeatInfo.mjs.map
