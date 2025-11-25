'use strict';

/**
 * Images are void elements. They handle the rendering of their children instead of Slate.
 * See the Slate documentation for more information:
 * - https://docs.slatejs.org/api/nodes/element#void-vs-not-void
 * - https://docs.slatejs.org/api/nodes/element#rendering-void-elements
 */ const withImages = (editor)=>{
    const { isVoid } = editor;
    editor.isVoid = (element)=>{
        return element.type === 'image' ? true : isVoid(element);
    };
    return editor;
};

exports.withImages = withImages;
//# sourceMappingURL=withImages.js.map
