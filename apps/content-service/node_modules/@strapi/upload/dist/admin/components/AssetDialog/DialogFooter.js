'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const DialogFooter = ({ onClose, onValidate })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                onClick: onClose,
                variant: "tertiary",
                children: formatMessage({
                    id: 'app.components.Button.cancel',
                    defaultMessage: 'Cancel'
                })
            }),
            onValidate && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                onClick: onValidate,
                children: formatMessage({
                    id: 'global.finish',
                    defaultMessage: 'Finish'
                })
            })
        ]
    });
};

exports.DialogFooter = DialogFooter;
//# sourceMappingURL=DialogFooter.js.map
