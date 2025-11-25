'use strict';

var slate = require('slate');

/**
 * Extracts some logic that is common to most blocks' handleConvert functions.
 * @returns The path of the converted block
 */ const baseHandleConvert = (editor, attributesToSet)=>{
    // If there is no selection, convert last inserted node
    const [_, lastNodePath] = slate.Editor.last(editor, []);
    // If the selection is inside a list, split the list so that the modified block is outside of it
    slate.Transforms.unwrapNodes(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list',
        split: true,
        at: editor.selection ?? lastNodePath
    });
    // Make sure we get a block node, not an inline node
    const [, updatedLastNodePath] = slate.Editor.last(editor, []);
    const entry = slate.Editor.above(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && node.type !== 'text' && node.type !== 'link',
        at: editor.selection ?? updatedLastNodePath
    });
    if (!entry || slate.Editor.isEditor(entry[0])) {
        return;
    }
    const [element, elementPath] = entry;
    slate.Transforms.setNodes(editor, {
        ...getAttributesToClear(element),
        ...attributesToSet
    }, {
        at: elementPath
    });
    return elementPath;
};
/**
 * Set all attributes except type and children to null so that Slate deletes them
 */ const getAttributesToClear = (element)=>{
    const { children: _children, type: _type, ...extra } = element;
    const attributesToClear = Object.keys(extra).reduce((currentAttributes, key)=>({
            ...currentAttributes,
            [key]: null
        }), {});
    return attributesToClear;
};

exports.baseHandleConvert = baseHandleConvert;
exports.getAttributesToClear = getAttributesToClear;
//# sourceMappingURL=conversions.js.map
