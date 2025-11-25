import { jsx } from 'react/jsx-runtime';
import { useIntl } from 'react-intl';
import { getBasename } from '../../../../../../../../admin/src/core/utils/basename.mjs';
import { MagicLinkWrapper } from '../../../../../../../../admin/src/pages/Settings/pages/Users/components/MagicLinkWrapper.mjs';

// FIXME replace with parts compo when ready
const MagicLinkEE = ({ registrationToken })=>{
    const { formatMessage } = useIntl();
    if (registrationToken) {
        return /*#__PURE__*/ jsx(MagicLinkWrapper, {
            target: `${window.location.origin}${getBasename()}/auth/register?registrationToken=${registrationToken}`,
            children: formatMessage({
                id: 'app.components.Users.MagicLink.connect',
                defaultMessage: 'Copy and share this link to give access to this user'
            })
        });
    }
    return /*#__PURE__*/ jsx(MagicLinkWrapper, {
        target: `${window.location.origin}${getBasename()}/auth/login`,
        children: formatMessage({
            id: 'app.components.Users.MagicLink.connect.sso',
            defaultMessage: 'Send this link to the user, the first login can be made via a SSO provider.'
        })
    });
};

export { MagicLinkEE };
//# sourceMappingURL=MagicLinkEE.mjs.map
