import _ from 'lodash';

const validatorsRegistry = ()=>{
    const validators = {};
    return {
        get (path) {
            return _.get(validators, path, []);
        },
        add (path, validator) {
            this.get(path).push(validator);
            return this;
        },
        set (path, value = []) {
            _.set(validators, path, value);
            return this;
        },
        has (path) {
            return _.has(validators, path);
        }
    };
};

export { validatorsRegistry as default };
//# sourceMappingURL=validators.mjs.map
