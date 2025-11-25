'use strict';

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

exports.getEntries = getEntries;
exports.getKeys = getKeys;
exports.isLinkNode = isLinkNode;
exports.isListNode = isListNode;
//# sourceMappingURL=types.js.map
