'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var ContentBox = require('../../../../../components/ContentBox.js');
var Notifications = require('../../../../../features/Notifications.js');
var useClipboard = require('../../../../../hooks/useClipboard.js');

const MagicLinkWrapper = ({ children, target })=>{
    const { toggleNotification } = Notifications.useNotification();
    const { formatMessage } = reactIntl.useIntl();
    const { copy } = useClipboard.useClipboard();
    const copyLabel = formatMessage({
        id: 'app.component.CopyToClipboard.label',
        defaultMessage: 'Copy to clipboard'
    });
    const handleClick = async (e)=>{
        e.preventDefault();
        const didCopy = await copy(target);
        if (didCopy) {
            toggleNotification({
                type: 'info',
                message: formatMessage({
                    id: 'notification.link-copied'
                })
            });
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(ContentBox.ContentBox, {
        endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
            label: copyLabel,
            variant: "ghost",
            onClick: handleClick,
            children: /*#__PURE__*/ jsxRuntime.jsx(icons.Duplicate, {})
        }),
        title: target,
        titleEllipsis: true,
        subtitle: children,
        icon: /*#__PURE__*/ jsxRuntime.jsx("span", {
            style: {
                fontSize: 32
            },
            children: "✉️"
        }),
        iconBackground: "neutral100"
    });
};

exports.MagicLinkWrapper = MagicLinkWrapper;
//# sourceMappingURL=MagicLinkWrapper.js.map
