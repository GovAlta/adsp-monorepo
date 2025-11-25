'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var slate = require('slate');
var slateReact = require('slate-react');
var styledComponents = require('styled-components');
var conversions = require('../utils/conversions.js');
var types = require('../utils/types.js');

const listStyle = styledComponents.css`
  display: flex;
  flex-direction: column;
  gap: ${({ theme })=>theme.spaces[2]};
  margin-inline-start: ${({ theme })=>theme.spaces[0]};
  margin-inline-end: ${({ theme })=>theme.spaces[0]};
  padding-inline-start: ${({ theme })=>theme.spaces[2]};

  ol,
  ul {
    margin-block-start: ${({ theme })=>theme.spaces[0]};
    margin-block-end: ${({ theme })=>theme.spaces[0]};
  }

  li {
    margin-inline-start: ${({ theme })=>theme.spaces[3]};
  }
`;
const Orderedlist = styledComponents.styled.ol`
  list-style-type: ${(props)=>props.$listStyleType};
  ${listStyle}
`;
const Unorderedlist = styledComponents.styled.ul`
  list-style-type: ${(props)=>props.$listStyleType};
  ${listStyle}
`;
const orderedStyles = [
    'decimal',
    'lower-alpha',
    'upper-roman'
];
const unorderedStyles = [
    'disc',
    'circle',
    'square'
];
const List = ({ attributes, children, element })=>{
    if (!types.isListNode(element)) {
        return null;
    }
    // Decide the subsequent style by referencing the given styles according to the format,
    // allowing for infinite nested lists
    const listStyles = element.format === 'ordered' ? orderedStyles : unorderedStyles;
    const nextIndex = (element.indentLevel || 0) % listStyles.length;
    const listStyleType = listStyles[nextIndex];
    if (element.format === 'ordered') {
        return /*#__PURE__*/ jsxRuntime.jsx(Orderedlist, {
            $listStyleType: listStyleType,
            ...attributes,
            children: children
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(Unorderedlist, {
        $listStyleType: listStyleType,
        ...attributes,
        children: children
    });
};
const replaceListWithEmptyBlock = (editor, currentListPath)=>{
    // Delete the empty list
    slate.Transforms.removeNodes(editor, {
        at: currentListPath
    });
    if (currentListPath[0] === 0) {
        // If the list was the only (or first) block element then insert empty paragraph as editor needs default value
        slate.Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [
                {
                    type: 'text',
                    text: ''
                }
            ]
        }, {
            at: currentListPath
        });
        slate.Transforms.select(editor, currentListPath);
    }
};
const isText = (node)=>{
    return slate.Node.isNode(node) && !slate.Editor.isEditor(node) && node.type === 'text';
};
/**
 * Common handler for the backspace event on ordered and unordered lists
 */ const handleBackspaceKeyOnList = (editor, event)=>{
    if (!editor.selection) return;
    const [currentListItem, currentListItemPath] = slate.Editor.parent(editor, editor.selection.anchor);
    const [currentList, currentListPath] = slate.Editor.parent(editor, currentListItemPath);
    const isListEmpty = currentList.children.length === 1 && isText(currentListItem.children[0]) && currentListItem.children[0].text === '';
    const isListItemEmpty = currentListItem.children.length === 1 && isText(currentListItem.children[0]) && currentListItem.children[0].text === '';
    const isFocusAtTheBeginningOfAChild = editor.selection.focus.offset === 0 && editor.selection.focus.path.at(-2) === 0;
    if (isListEmpty) {
        const parentListEntry = slate.Editor.above(editor, {
            at: currentListPath,
            match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list'
        });
        if (!parentListEntry) {
            event.preventDefault();
            replaceListWithEmptyBlock(editor, currentListPath);
        }
    } else if (isFocusAtTheBeginningOfAChild) {
        // If the focus is at the beginning of a child node we need to replace it with a paragraph
        slate.Transforms.liftNodes(editor, {
            match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list-item'
        });
        slate.Transforms.setNodes(editor, {
            type: 'paragraph'
        });
    } else if (isListItemEmpty) {
        const previousEntry = slate.Editor.previous(editor, {
            at: currentListItemPath
        });
        const nextEntry = slate.Editor.next(editor, {
            at: currentListItemPath
        });
        if (previousEntry && nextEntry) {
            // If previous and next nodes are lists or list-items, delete empty list item
            event.preventDefault();
            slate.Transforms.removeNodes(editor, {
                at: currentListItemPath
            });
            // If previous and next nodes are lists with same format and indent Levels, then merge the nodes
            const [previousList] = previousEntry;
            const [nextList] = nextEntry;
            if (!slate.Editor.isEditor(previousList) && !isText(previousList) && types.isListNode(previousList) && !slate.Editor.isEditor(nextList) && !isText(nextList) && types.isListNode(nextList)) {
                if (previousList.type === 'list' && nextList.type === 'list' && previousList.format === nextList.format && previousList.indentLevel === nextList.indentLevel) {
                    slate.Transforms.mergeNodes(editor, {
                        at: currentListItemPath
                    });
                }
            }
        }
    }
};
/**
 * Common handler for the enter key on ordered and unordered lists
 */ const handleEnterKeyOnList = (editor)=>{
    const currentListItemEntry = slate.Editor.above(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list-item'
    });
    if (!currentListItemEntry || !editor.selection) {
        return;
    }
    const [currentListItem, currentListItemPath] = currentListItemEntry;
    const [currentList, currentListPath] = slate.Editor.parent(editor, currentListItemPath);
    const isListEmpty = currentList.children.length === 1 && isText(currentListItem.children[0]) && currentListItem.children[0].text === '';
    const isListItemEmpty = currentListItem.children.length === 1 && isText(currentListItem.children[0]) && currentListItem.children[0].text === '';
    const isFocusAtTheBeginningOfAChild = editor.selection.focus.offset === 0 && editor.selection.focus.path.at(-1) === 0;
    if (isListEmpty) {
        replaceListWithEmptyBlock(editor, currentListPath);
    } else if (isFocusAtTheBeginningOfAChild && !isListItemEmpty) {
        // If the focus is at the beginning of a child node, shift below the list item and create a new list-item
        const currentNode = slate.Editor.above(editor, {
            at: editor.selection.anchor
        });
        slate.Transforms.insertNodes(editor, {
            type: 'list-item',
            children: [
                {
                    type: 'text',
                    text: ''
                }
            ]
        });
        if (currentNode) {
            const path = currentNode[1];
            const updatedPath = [
                ...path.slice(0, -1),
                path[path.length - 1] + 1
            ];
            slate.Transforms.select(editor, {
                anchor: {
                    path: updatedPath.concat(0),
                    offset: 0
                },
                focus: {
                    path: updatedPath.concat(0),
                    offset: 0
                }
            });
        }
    } else if (isListItemEmpty) {
        // Check if there is a list above the current list and shift list-item under it
        if (!slate.Editor.isEditor(currentList) && types.isListNode(currentList) && currentList?.indentLevel && currentList.indentLevel > 0) {
            const previousIndentLevel = currentList.indentLevel - 1;
            const parentListNodeEntry = slate.Editor.above(editor, {
                match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list' && (node.indentLevel || 0) === previousIndentLevel
            });
            if (parentListNodeEntry) {
                // Get the parent list path and add 1 to it to exit from the current list
                const modifiedPath = currentListItemPath.slice(0, -1);
                if (modifiedPath.length > 0) {
                    modifiedPath[modifiedPath.length - 1] += 1;
                }
                // Shift list-item under parent list
                slate.Transforms.moveNodes(editor, {
                    at: currentListItemPath,
                    to: modifiedPath
                });
                return;
            }
        }
        // Otherwise delete the empty list item and create a new paragraph below the parent list
        slate.Transforms.removeNodes(editor, {
            at: currentListItemPath
        });
        const createdParagraphPath = slate.Path.next(currentListPath);
        slate.Transforms.insertNodes(editor, {
            type: 'paragraph',
            children: [
                {
                    type: 'text',
                    text: ''
                }
            ]
        }, {
            at: createdParagraphPath
        });
        // Move the selection to the newly created paragraph
        slate.Transforms.select(editor, createdParagraphPath);
    } else {
        // Check if the cursor is at the end of the list item
        const isNodeEnd = slate.Editor.isEnd(editor, editor.selection.anchor, currentListItemPath);
        if (isNodeEnd) {
            // If there was nothing after the cursor, create a fresh new list item,
            // in order to avoid carrying over the modifiers from the previous list item
            slate.Transforms.insertNodes(editor, {
                type: 'list-item',
                children: [
                    {
                        type: 'text',
                        text: ''
                    }
                ]
            });
        } else {
            // If there is something after the cursor, split the current list item,
            // so that we keep the content and the modifiers
            slate.Transforms.splitNodes(editor);
        }
    }
};
/**
 * Common handler for converting a node to a list
 */ const handleConvertToList = (editor, format)=>{
    const convertedPath = conversions.baseHandleConvert(editor, {
        type: 'list-item'
    });
    if (!convertedPath) return;
    slate.Transforms.wrapNodes(editor, {
        type: 'list',
        format,
        children: []
    }, {
        at: convertedPath
    });
};
/**
 * Common handler for the tab key on ordered and unordered lists
 */ const handleTabOnList = (editor)=>{
    const currentListItemEntry = slate.Editor.above(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && node.type === 'list-item'
    });
    if (!currentListItemEntry || !editor.selection) {
        return;
    }
    const [currentListItem, currentListItemPath] = currentListItemEntry;
    const [currentList] = slate.Editor.parent(editor, currentListItemPath);
    // Skip tabbing if list-item is the first item in the list
    if (currentListItem === currentList.children[0]) return;
    const currentListItemIndex = currentList.children.findIndex((item)=>item === currentListItem);
    const previousNode = currentList.children[currentListItemIndex - 1];
    // If previous node is a list block then move the list-item under it
    if (previousNode.type === 'list') {
        const nodePath = slateReact.ReactEditor.findPath(editor, previousNode);
        const insertAtPath = previousNode.children.length;
        slate.Transforms.moveNodes(editor, {
            at: currentListItemPath,
            to: nodePath.concat(insertAtPath)
        });
        return;
    }
    if (!slate.Editor.isEditor(currentList) && types.isListNode(currentList)) {
        // Wrap list-item with list block on tab
        slate.Transforms.wrapNodes(editor, {
            type: 'list',
            format: currentList.format,
            indentLevel: (currentList.indentLevel || 0) + 1,
            children: []
        });
    }
};
const listBlocks = {
    'list-ordered': {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(List, {
                ...props
            }),
        label: {
            id: 'components.Blocks.blocks.orderedList',
            defaultMessage: 'Numbered list'
        },
        icon: Icons.NumberList,
        matchNode: (node)=>node.type === 'list' && node.format === 'ordered',
        isInBlocksSelector: true,
        handleConvert: (editor)=>handleConvertToList(editor, 'ordered'),
        handleEnterKey: handleEnterKeyOnList,
        handleBackspaceKey: handleBackspaceKeyOnList,
        handleTab: handleTabOnList,
        snippets: [
            '1.'
        ]
    },
    'list-unordered': {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(List, {
                ...props
            }),
        label: {
            id: 'components.Blocks.blocks.unorderedList',
            defaultMessage: 'Bulleted list'
        },
        icon: Icons.BulletList,
        matchNode: (node)=>node.type === 'list' && node.format === 'unordered',
        isInBlocksSelector: true,
        handleConvert: (editor)=>handleConvertToList(editor, 'unordered'),
        handleEnterKey: handleEnterKeyOnList,
        handleBackspaceKey: handleBackspaceKeyOnList,
        handleTab: handleTabOnList,
        snippets: [
            '-',
            '*',
            '+'
        ]
    },
    'list-item': {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                tag: "li",
                ...props.attributes,
                children: props.children
            }),
        // No handleConvert, list items are created when converting to the parent list
        matchNode: (node)=>node.type === 'list-item',
        isInBlocksSelector: false,
        dragHandleTopMargin: '-2px'
    }
};

exports.listBlocks = listBlocks;
//# sourceMappingURL=List.js.map
