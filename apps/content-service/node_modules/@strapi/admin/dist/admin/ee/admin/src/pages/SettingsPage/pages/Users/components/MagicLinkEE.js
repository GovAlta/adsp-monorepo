'use strict';

var jsxRuntime = require('react/jsx-runtime');
var reactIntl = require('react-intl');
var basename = require('../../../../../../../../admin/src/core/utils/basename.js');
var MagicLinkWrapper = require('../../../../../../../../admin/src/pages/Settings/pages/Users/components/MagicLinkWrapper.js');

// FIXME replace with parts compo when ready
const MagicLinkEE = ({ registrationToken })=>{
    const { formatMessage } = reactIntl.useIntl();
    if (registrationToken) {
        return /*#__PURE__*/ jsxRuntime.jsx(MagicLinkWrapper.MagicLinkWrapper, {
            target: `${window.location.origin}${basename.getBasename()}/auth/register?registrationToken=${registrationToken}`,
            children: formatMessage({
                id: 'app.components.Users.MagicLink.connect',
                defaultMessage: 'Copy and share this link to give access to this user'
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(MagicLinkWrapper.MagicLinkWrapper, {
        target: `${window.location.origin}${basename.getBasename()}/auth/login`,
        children: formatMessage({
            id: 'app.components.Users.MagicLink.connect.sso',
            defaultMessage: 'Send this link to the user, the first login can be made via a SSO provider.'
        })
    });
};

exports.MagicLinkEE = MagicLinkEE;
//# sourceMappingURL=MagicLinkEE.js.map
