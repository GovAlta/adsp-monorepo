'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var slate = require('slate');
var conversions = require('../utils/conversions.js');

const paragraphBlocks = {
    paragraph: {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                tag: "p",
                variant: "omega",
                ...props.attributes,
                children: props.children
            }),
        icon: Icons.Paragraph,
        label: {
            id: 'components.Blocks.blocks.text',
            defaultMessage: 'Text'
        },
        matchNode: (node)=>node.type === 'paragraph',
        isInBlocksSelector: true,
        dragHandleTopMargin: '-2px',
        handleConvert (editor) {
            conversions.baseHandleConvert(editor, {
                type: 'paragraph'
            });
        },
        handleEnterKey (editor) {
            if (!editor.selection) {
                return;
            }
            // We need to keep track of the initial position of the cursor
            const anchorPathInitialPosition = editor.selection.anchor.path;
            /**
       * Split the nodes where the cursor is. This will create a new paragraph with the content
       * after the cursor, while retaining all the children, modifiers etc.
       */ slate.Transforms.splitNodes(editor, {
                // Makes sure we always create a new node,
                // even if there's nothing to the right of the cursor in the node.
                always: true
            });
            // Check if the created node is empty (if there was no text after the cursor in the node)
            // This lets us know if we need to carry over the modifiers from the previous node
            const parentBlockEntry = slate.Editor.above(editor, {
                match: (node)=>!slate.Editor.isEditor(node) && node.type !== 'text'
            });
            if (!parentBlockEntry) {
                return;
            }
            const [, parentBlockPath] = parentBlockEntry;
            const isNodeEnd = slate.Editor.isEnd(editor, editor.selection.anchor, parentBlockPath);
            /**
       * Delete and recreate the node that was created at the right of the cursor.
       * This is to avoid node pollution
       * (e.g. keeping the level attribute when converting a heading to a paragraph).
       * Select the parent of the selection because we want the full block, not the leaf.
       * And copy its children to make sure we keep the modifiers.
       */ const [fragmentedNode] = slate.Editor.parent(editor, editor.selection.anchor.path);
            slate.Transforms.removeNodes(editor);
            // Check if after the current position there is another node
            const hasNextNode = editor.children.length - anchorPathInitialPosition[0] > 1;
            // Insert the new node at the right position.
            // The next line after the editor selection if present or otherwise at the end of the editor.
            slate.Transforms.insertNodes(editor, {
                type: 'paragraph',
                // Don't carry over the modifiers from the previous node if there was no text after the cursor
                children: isNodeEnd ? [
                    {
                        type: 'text',
                        text: ''
                    }
                ] : fragmentedNode.children
            }, {
                at: hasNextNode ? [
                    anchorPathInitialPosition[0] + 1
                ] : [
                    editor.children.length
                ]
            });
            /**
       * The new selection will by default be at the end of the created node.
       * Instead we manually move it to the start of the created node.
       * Make sure to we go to the start of the node and not the start of the leaf.
       */ slate.Transforms.select(editor, editor.start([
                anchorPathInitialPosition[0] + 1
            ]));
        }
    }
};

exports.paragraphBlocks = paragraphBlocks;
//# sourceMappingURL=Paragraph.js.map
