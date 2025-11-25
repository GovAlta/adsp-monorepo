import { Editor } from 'slate';
/**
 * This plugin is used to normalize the Slate document to match the Strapi schema.
 */
declare const withStrapiSchema: (editor: Editor) => Omit<import("slate").BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor & import("./withLinks").LinkEditor, "children"> & {
    children: import("@strapi/types/dist/schema/attribute").BlocksValue;
};
export { withStrapiSchema };
