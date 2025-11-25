'use strict';

var slate = require('slate');

const removeLink = (editor)=>{
    slate.Transforms.unwrapNodes(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && slate.Element.isElement(node) && node.type === 'link'
    });
};
const insertLink = (editor, { url })=>{
    if (editor.selection) {
        // We want to remove all link on the selection
        const linkNodes = Array.from(slate.Editor.nodes(editor, {
            at: editor.selection,
            match: (node)=>!slate.Editor.isEditor(node) && node.type === 'link'
        }));
        linkNodes.forEach(([, path])=>{
            slate.Transforms.unwrapNodes(editor, {
                at: path
            });
        });
        if (slate.Range.isCollapsed(editor.selection)) {
            const link = {
                type: 'link',
                url: url ?? '',
                children: [
                    {
                        type: 'text',
                        text: url
                    }
                ]
            };
            slate.Transforms.insertNodes(editor, link);
        } else {
            slate.Transforms.wrapNodes(editor, {
                type: 'link',
                url: url ?? ''
            }, {
                split: true
            });
        }
    }
};
const editLink = (editor, link)=>{
    const { url, text } = link;
    if (!editor.selection) {
        return;
    }
    const linkEntry = slate.Editor.above(editor, {
        match: (node)=>!slate.Editor.isEditor(node) && node.type === 'link'
    });
    if (linkEntry) {
        const [, linkPath] = linkEntry;
        slate.Transforms.setNodes(editor, {
            url
        }, {
            at: linkPath
        });
        // If link text is different, we remove the old text and insert the new one
        if (text !== '' && text !== slate.Editor.string(editor, linkPath)) {
            const linkNodeChildrens = Array.from(slate.Node.children(editor, linkPath, {
                reverse: true
            }));
            linkNodeChildrens.forEach(([, childPath])=>{
                slate.Transforms.removeNodes(editor, {
                    at: childPath
                });
            });
            slate.Transforms.insertNodes(editor, [
                {
                    type: 'text',
                    text
                }
            ], {
                at: linkPath.concat(0)
            });
        }
    }
};

exports.editLink = editLink;
exports.insertLink = insertLink;
exports.removeLink = removeLink;
//# sourceMappingURL=links.js.map
