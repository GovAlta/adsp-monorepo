import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Button } from '@strapi/design-system';
import { Mail } from '@strapi/icons';
import { useIntl } from 'react-intl';

const CreateActionCE = /*#__PURE__*/ React.forwardRef((props, ref)=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Button, {
        ref: ref,
        startIcon: /*#__PURE__*/ jsx(Mail, {}),
        size: "S",
        ...props,
        children: formatMessage({
            id: 'Settings.permissions.users.create',
            defaultMessage: 'Invite new user'
        })
    });
});

export { CreateActionCE };
//# sourceMappingURL=CreateActionCE.mjs.map
