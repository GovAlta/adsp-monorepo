'use strict';

var utils = require('../utils.js');

const visitor = ({ key, attribute, path })=>{
    if (attribute?.type === 'password') {
        utils.throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

module.exports = visitor;
//# sourceMappingURL=throw-password.js.map
