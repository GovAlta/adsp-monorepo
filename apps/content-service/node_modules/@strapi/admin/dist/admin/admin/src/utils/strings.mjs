const capitalise = (str)=>str.charAt(0).toUpperCase() + str.slice(1);
function getByteSize(value) {
    return new TextEncoder().encode(value).length;
}

export { capitalise, getByteSize };
//# sourceMappingURL=strings.mjs.map
