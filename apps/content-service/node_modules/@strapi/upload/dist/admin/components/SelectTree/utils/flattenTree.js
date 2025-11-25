'use strict';

function flattenTree(tree, parent = null, depth = 0) {
    return tree.flatMap((item)=>item.children ? [
            {
                ...item,
                parent: parent?.value,
                depth
            },
            ...flattenTree(item.children, item, depth + 1)
        ] : {
            ...item,
            depth,
            parent: parent?.value
        });
}

exports.flattenTree = flattenTree;
//# sourceMappingURL=flattenTree.js.map
