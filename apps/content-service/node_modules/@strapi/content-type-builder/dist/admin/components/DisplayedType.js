'use strict';

var jsxRuntime = require('react/jsx-runtime');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');

const DisplayedType = ({ type, customField = null, repeatable = false, multiple = false })=>{
    const { formatMessage } = reactIntl.useIntl();
    let readableType = type;
    if ([
        'integer',
        'biginteger',
        'float',
        'decimal'
    ].includes(type)) {
        readableType = 'number';
    } else if ([
        'string'
    ].includes(type)) {
        readableType = 'text';
    }
    if (customField) {
        return formatMessage({
            id: getTrad.getTrad('attribute.customField'),
            defaultMessage: 'Custom field'
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            repeatable && formatMessage({
                id: getTrad.getTrad('component.repeatable'),
                defaultMessage: 'Repeatable'
            }),
            multiple && formatMessage({
                id: getTrad.getTrad('media.multiple'),
                defaultMessage: 'Multiple'
            }),
            " ",
            formatMessage({
                id: getTrad.getTrad(`attribute.${readableType}`),
                defaultMessage: type
            })
        ]
    });
};

exports.DisplayedType = DisplayedType;
//# sourceMappingURL=DisplayedType.js.map
