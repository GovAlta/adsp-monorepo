'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');

// TODO: find a better naming convention for the file that was an index file before
const CopyLinkButton = ({ url })=>{
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { copy } = strapiAdmin.useClipboard();
    const handleClick = async ()=>{
        const didCopy = await copy(url);
        if (didCopy) {
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'notification.link-copied',
                    defaultMessage: 'Link copied into the clipboard'
                })
            });
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
        label: formatMessage({
            id: getTrad.getTrad('control-card.copy-link'),
            defaultMessage: 'Copy link'
        }),
        onClick: handleClick,
        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Link, {})
    });
};

exports.CopyLinkButton = CopyLinkButton;
//# sourceMappingURL=CopyLinkButton.js.map
