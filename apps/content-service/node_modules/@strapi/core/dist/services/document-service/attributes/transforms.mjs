import { isString, toNumber, getOr } from 'lodash/fp';
import bcrypt from 'bcryptjs';

const transforms = {
    password (value, context) {
        const { attribute } = context;
        if (attribute.type !== 'password') {
            throw new Error('Invalid attribute type');
        }
        if (!isString(value) && !(value instanceof Buffer)) {
            return value;
        }
        const rounds = toNumber(getOr(10, 'encryption.rounds', attribute));
        return bcrypt.hashSync(value.toString(), rounds);
    }
};

export { transforms as default };
//# sourceMappingURL=transforms.mjs.map
