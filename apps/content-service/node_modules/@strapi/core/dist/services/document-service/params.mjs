import { pick } from 'lodash/fp';

const pickSelectionParams = (data)=>{
    return pick([
        'fields',
        'populate',
        'status'
    ], data);
};

export { pickSelectionParams };
//# sourceMappingURL=params.mjs.map
