import _ from 'lodash';

const isTruthy = (val)=>{
    return [
        1,
        true
    ].includes(val) || [
        'true',
        '1'
    ].includes(_.toLower(val));
};

export { isTruthy as default };
//# sourceMappingURL=is-truthy.mjs.map
