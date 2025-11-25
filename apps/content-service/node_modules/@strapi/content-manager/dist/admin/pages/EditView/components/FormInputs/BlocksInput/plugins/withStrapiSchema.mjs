import { Element, Transforms, Node, Editor } from 'slate';

const isText = (node)=>{
    return Node.isNode(node) && !Editor.isEditor(node) && node.type === 'text';
};
/**
 * This plugin is used to normalize the Slate document to match the Strapi schema.
 */ const withStrapiSchema = (editor)=>{
    const { normalizeNode } = editor;
    /**
   * On the strapi schema, we want text nodes to have type: text
   * By default, Slate add text nodes without type: text
   * So we add this normalization for the cases when Slate add text nodes automatically
   */ editor.normalizeNode = (entry)=>{
        const [node, path] = entry;
        if (!Element.isElement(node) && !isText(node)) {
            Transforms.setNodes(editor, {
                type: 'text'
            }, {
                at: path
            });
            return;
        }
        normalizeNode(entry);
    };
    return editor;
};

export { withStrapiSchema };
//# sourceMappingURL=withStrapiSchema.mjs.map
