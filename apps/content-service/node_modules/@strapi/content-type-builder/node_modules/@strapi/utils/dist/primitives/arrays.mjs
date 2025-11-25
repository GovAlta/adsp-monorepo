const castIncludes = (arr, val, cast)=>arr.map((val)=>cast(val)).includes(cast(val));
const includesString = (arr, val)=>castIncludes(arr, val, String);

export { includesString };
//# sourceMappingURL=arrays.mjs.map
