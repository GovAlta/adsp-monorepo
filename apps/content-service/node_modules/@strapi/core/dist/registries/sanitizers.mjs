import _ from 'lodash';

const sanitizersRegistry = ()=>{
    const sanitizers = {};
    return {
        get (path) {
            return _.get(sanitizers, path, []);
        },
        add (path, sanitizer) {
            this.get(path).push(sanitizer);
            return this;
        },
        set (path, value = []) {
            _.set(sanitizers, path, value);
            return this;
        },
        has (path) {
            return _.has(sanitizers, path);
        }
    };
};

export { sanitizersRegistry as default };
//# sourceMappingURL=sanitizers.mjs.map
