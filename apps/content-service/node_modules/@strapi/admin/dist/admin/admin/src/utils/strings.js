'use strict';

const capitalise = (str)=>str.charAt(0).toUpperCase() + str.slice(1);
function getByteSize(value) {
    return new TextEncoder().encode(value).length;
}

exports.capitalise = capitalise;
exports.getByteSize = getByteSize;
//# sourceMappingURL=strings.js.map
