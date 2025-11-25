'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var constants = require('../../constants.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../utils/urlYupSchema.js');

// TODO: find a better naming convention for the file that was an index file before
const SortPicker = ({ onChangeSort, value })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
        size: "S",
        value: value,
        onChange: (value)=>onChangeSort(value.toString()),
        "aria-label": formatMessage({
            id: getTrad.getTrad('sort.label'),
            defaultMessage: 'Sort by'
        }),
        placeholder: formatMessage({
            id: getTrad.getTrad('sort.label'),
            defaultMessage: 'Sort by'
        }),
        children: constants.sortOptions.map((filter)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                value: filter.value,
                children: formatMessage({
                    id: getTrad.getTrad(filter.key),
                    defaultMessage: `${filter.value}`
                })
            }, filter.key))
    });
};

exports.SortPicker = SortPicker;
//# sourceMappingURL=SortPicker.js.map
