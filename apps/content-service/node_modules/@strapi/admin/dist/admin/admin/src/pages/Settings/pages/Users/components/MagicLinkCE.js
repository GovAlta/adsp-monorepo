'use strict';

var jsxRuntime = require('react/jsx-runtime');
var reactIntl = require('react-intl');
var basename = require('../../../../../core/utils/basename.js');
var MagicLinkWrapper = require('./MagicLinkWrapper.js');

const MagicLinkCE = ({ registrationToken })=>{
    const { formatMessage } = reactIntl.useIntl();
    const target = `${window.location.origin}${basename.getBasename()}/auth/register?registrationToken=${registrationToken}`;
    return /*#__PURE__*/ jsxRuntime.jsx(MagicLinkWrapper.MagicLinkWrapper, {
        target: target,
        children: formatMessage({
            id: 'app.components.Users.MagicLink.connect',
            defaultMessage: 'Copy and share this link to give access to this user'
        })
    });
};

exports.MagicLinkCE = MagicLinkCE;
//# sourceMappingURL=MagicLinkCE.js.map
