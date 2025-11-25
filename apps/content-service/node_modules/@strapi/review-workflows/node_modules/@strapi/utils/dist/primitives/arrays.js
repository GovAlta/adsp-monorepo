'use strict';

const castIncludes = (arr, val, cast)=>arr.map((val)=>cast(val)).includes(cast(val));
const includesString = (arr, val)=>castIncludes(arr, val, String);

exports.includesString = includesString;
//# sourceMappingURL=arrays.js.map
