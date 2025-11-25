import { throwInvalidKey } from '../utils.mjs';

const visitor = ({ key, attribute, path })=>{
    if (attribute?.type === 'password') {
        throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

export { visitor as default };
//# sourceMappingURL=throw-password.mjs.map
