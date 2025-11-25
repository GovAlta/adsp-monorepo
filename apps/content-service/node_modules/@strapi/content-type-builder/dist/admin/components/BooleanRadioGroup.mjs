import { jsx } from 'react/jsx-runtime';
import 'react';
import { CustomRadioGroup } from './CustomRadioGroup/CustomRadioGroup.mjs';

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
    return /*#__PURE__*/ jsx(CustomRadioGroup, {
        ...rest,
        name: name,
        onChange: handleChange,
        intlLabel: intlLabel
    });
};

export { BooleanRadioGroup };
//# sourceMappingURL=BooleanRadioGroup.mjs.map
