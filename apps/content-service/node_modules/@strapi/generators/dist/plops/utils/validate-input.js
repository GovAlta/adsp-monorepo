'use strict';

var validateInput = ((input)=>{
    const regex = /^[A-Za-z-]+$/g;
    if (!input) {
        return 'You must provide an input';
    }
    return regex.test(input) || "Please use only letters, '-' and no spaces";
});

module.exports = validateInput;
//# sourceMappingURL=validate-input.js.map
