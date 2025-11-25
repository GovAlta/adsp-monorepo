'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const DialogHeader = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
            children: formatMessage({
                id: 'global.details',
                defaultMessage: 'Details'
            })
        })
    });
};

exports.DialogHeader = DialogHeader;
//# sourceMappingURL=DialogHeader.js.map
