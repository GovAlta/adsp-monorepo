import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, Tooltip, Button } from '@strapi/design-system';
import { WarningCircle, Mail } from '@strapi/icons';
import isNil from 'lodash/isNil';
import { useIntl } from 'react-intl';
import { useLicenseLimits } from '../../../../../hooks/useLicenseLimits.mjs';

const CreateActionEE = /*#__PURE__*/ React.forwardRef((props, ref)=>{
    const { formatMessage } = useIntl();
    const { license, isError, isLoading } = useLicenseLimits();
    const { permittedSeats, shouldStopCreate } = license ?? {};
    if (isError || isLoading) {
        return null;
    }
    return /*#__PURE__*/ jsxs(Flex, {
        gap: 2,
        children: [
            !isNil(permittedSeats) && shouldStopCreate && /*#__PURE__*/ jsx(Tooltip, {
                label: formatMessage({
                    id: 'Settings.application.admin-seats.at-limit-tooltip',
                    defaultMessage: 'At limit: add seats to invite more users'
                }),
                side: "left",
                children: /*#__PURE__*/ jsx(WarningCircle, {
                    width: "1.4rem",
                    height: "1.4rem",
                    fill: "danger500"
                })
            }),
            /*#__PURE__*/ jsx(Button, {
                ref: ref,
                "data-testid": "create-user-button",
                startIcon: /*#__PURE__*/ jsx(Mail, {}),
                size: "S",
                disabled: shouldStopCreate,
                ...props,
                children: formatMessage({
                    id: 'Settings.permissions.users.create',
                    defaultMessage: 'Invite new user'
                })
            })
        ]
    });
});

export { CreateActionEE };
//# sourceMappingURL=CreateActionEE.mjs.map
