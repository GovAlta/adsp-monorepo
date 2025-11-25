import { type Editor } from 'slate';
/**
 * Images are void elements. They handle the rendering of their children instead of Slate.
 * See the Slate documentation for more information:
 * - https://docs.slatejs.org/api/nodes/element#void-vs-not-void
 * - https://docs.slatejs.org/api/nodes/element#rendering-void-elements
 */
declare const withImages: (editor: Editor) => Omit<import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor & import("./withLinks").LinkEditor, "children"> & {
    children: import("@strapi/types/dist/schema/attribute").BlocksValue;
};
export { withImages };
