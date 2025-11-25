'use strict';

const visitor = ({ key, attribute }, { remove })=>{
    if (attribute?.type === 'password') {
        remove(key);
    }
};

module.exports = visitor;
//# sourceMappingURL=remove-password.js.map
