'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var strings = require('../../../utils/strings.js');

/**
 * @public
 * @description Displays the status of a document (draft, published, etc.)
 * and automatically calculates the appropriate variant for the status.
 */ const DocumentStatus = ({ status = 'draft', size = 'S', ...restProps })=>{
    const statusVariant = status === 'draft' ? 'secondary' : status === 'published' ? 'success' : 'alternative';
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Status, {
        ...restProps,
        size: size,
        variant: statusVariant,
        role: "status",
        "aria-label": status,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
            tag: "span",
            variant: "omega",
            fontWeight: "bold",
            children: formatMessage({
                id: `content-manager.containers.List.${status}`,
                defaultMessage: strings.capitalise(status)
            })
        })
    });
};

exports.DocumentStatus = DocumentStatus;
//# sourceMappingURL=DocumentStatus.js.map
