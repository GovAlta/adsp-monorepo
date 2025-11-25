'use strict';

var slate = require('slate');

const isText = (node)=>{
    return slate.Node.isNode(node) && !slate.Editor.isEditor(node) && node.type === 'text';
};
/**
 * Inserts a line break the first time the user presses enter, and exits the node the second time.
 */ const pressEnterTwiceToExit = (editor)=>{
    /**
   * To determine if we should break out of the node, check 2 things:
   * 1. If the cursor is at the end of the node
   * 2. If the last line of the node is empty
   */ const nodeEntry = slate.Editor.above(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && ![
                'link',
                'text'
            ].includes(node.type)
    });
    if (!nodeEntry || !editor.selection) {
        return;
    }
    const [node, nodePath] = nodeEntry;
    const isNodeEnd = slate.Editor.isEnd(editor, editor.selection.anchor, nodePath);
    const lastTextNode = node.children.at(-1);
    const isEmptyLine = isText(lastTextNode) && lastTextNode.text.endsWith('\n');
    if (isNodeEnd && isEmptyLine) {
        // Remove the last line break
        slate.Transforms.delete(editor, {
            distance: 1,
            unit: 'character',
            reverse: true
        });
        // Break out of the node by creating a new paragraph
        slate.Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [
                {
                    type: 'text',
                    text: ''
                }
            ]
        });
        return;
    }
    // Otherwise insert a new line within the node
    slate.Transforms.insertText(editor, '\n');
    // If there's nothing after the cursor, disable modifiers
    if (isNodeEnd) {
        [
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code'
        ].forEach((modifier)=>{
            slate.Editor.removeMark(editor, modifier);
        });
    }
};

exports.pressEnterTwiceToExit = pressEnterTwiceToExit;
//# sourceMappingURL=enterKey.js.map
