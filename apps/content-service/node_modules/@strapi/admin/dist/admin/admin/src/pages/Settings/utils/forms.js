'use strict';

const isErrorMessageMessageDescriptor = (message)=>{
    return typeof message === 'object' && message !== null && 'id' in message;
};

exports.isErrorMessageMessageDescriptor = isErrorMessageMessageDescriptor;
//# sourceMappingURL=forms.js.map
