'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');

const FilterTag = ({ attribute, filter, onClick, operator, value })=>{
    const { formatMessage, formatDate, formatTime } = reactIntl.useIntl();
    const handleClick = ()=>{
        onClick(filter);
    };
    const { fieldSchema } = attribute;
    const type = fieldSchema?.type;
    let formattedValue = value;
    if (type === 'date') {
        formattedValue = formatDate(value, {
            dateStyle: 'full'
        });
    }
    if (type === 'datetime') {
        formattedValue = formatDate(value, {
            dateStyle: 'full',
            timeStyle: 'short'
        });
    }
    if (type === 'time') {
        const [hour, minute] = value.split(':');
        const date = new Date();
        date.setHours(Number(hour));
        date.setMinutes(Number(minute));
        formattedValue = formatTime(date, {
            hour: 'numeric',
            minute: 'numeric'
        });
    }
    const content = `${attribute.metadatas?.label} ${formatMessage({
        id: `components.FilterOptions.FILTER_TYPES.${operator}`,
        defaultMessage: operator
    })} ${formattedValue}`;
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tag, {
        onClick: handleClick,
        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
        padding: 1,
        children: content
    });
};

exports.FilterTag = FilterTag;
//# sourceMappingURL=FilterTag.js.map
