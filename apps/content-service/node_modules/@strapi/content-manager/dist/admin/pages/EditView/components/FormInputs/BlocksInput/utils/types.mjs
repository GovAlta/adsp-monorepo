// Wrap Object.entries to get the correct types
const getEntries = (object)=>Object.entries(object);
// Wrap Object.keys to get the correct types
const getKeys = (object)=>Object.keys(object);
const isLinkNode = (element)=>{
    return element.type === 'link';
};
const isListNode = (element)=>{
    return element.type === 'list';
};

export { getEntries, getKeys, isLinkNode, isListNode };
//# sourceMappingURL=types.mjs.map
