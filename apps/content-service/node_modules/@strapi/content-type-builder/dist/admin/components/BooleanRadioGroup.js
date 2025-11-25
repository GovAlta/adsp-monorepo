'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var CustomRadioGroup = require('./CustomRadioGroup/CustomRadioGroup.js');

const BooleanRadioGroup = ({ onChange, name, intlLabel, ...rest })=>{
    const handleChange = (e)=>{
        const checked = e.target.value !== 'false';
        onChange({
            target: {
                name,
                value: checked,
                type: 'boolean-radio-group'
            }
        });
    };
    return /*#__PURE__*/ jsxRuntime.jsx(CustomRadioGroup.CustomRadioGroup, {
        ...rest,
        name: name,
        onChange: handleChange,
        intlLabel: intlLabel
    });
};

exports.BooleanRadioGroup = BooleanRadioGroup;
//# sourceMappingURL=BooleanRadioGroup.js.map
