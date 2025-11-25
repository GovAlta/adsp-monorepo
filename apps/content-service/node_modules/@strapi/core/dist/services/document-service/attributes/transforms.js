'use strict';

var fp = require('lodash/fp');
var bcrypt = require('bcryptjs');

const transforms = {
    password (value, context) {
        const { attribute } = context;
        if (attribute.type !== 'password') {
            throw new Error('Invalid attribute type');
        }
        if (!fp.isString(value) && !(value instanceof Buffer)) {
            return value;
        }
        const rounds = fp.toNumber(fp.getOr(10, 'encryption.rounds', attribute));
        return bcrypt.hashSync(value.toString(), rounds);
    }
};

module.exports = transforms;
//# sourceMappingURL=transforms.js.map
