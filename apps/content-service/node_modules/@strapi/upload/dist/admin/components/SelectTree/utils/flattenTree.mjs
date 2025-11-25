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

export { flattenTree };
//# sourceMappingURL=flattenTree.mjs.map
