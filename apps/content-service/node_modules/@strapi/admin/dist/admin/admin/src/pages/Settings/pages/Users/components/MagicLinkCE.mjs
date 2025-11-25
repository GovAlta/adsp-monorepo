import { jsx } from 'react/jsx-runtime';
import { useIntl } from 'react-intl';
import { getBasename } from '../../../../../core/utils/basename.mjs';
import { MagicLinkWrapper } from './MagicLinkWrapper.mjs';

const MagicLinkCE = ({ registrationToken })=>{
    const { formatMessage } = useIntl();
    const target = `${window.location.origin}${getBasename()}/auth/register?registrationToken=${registrationToken}`;
    return /*#__PURE__*/ jsx(MagicLinkWrapper, {
        target: target,
        children: formatMessage({
            id: 'app.components.Users.MagicLink.connect',
            defaultMessage: 'Copy and share this link to give access to this user'
        })
    });
};

export { MagicLinkCE };
//# sourceMappingURL=MagicLinkCE.mjs.map
