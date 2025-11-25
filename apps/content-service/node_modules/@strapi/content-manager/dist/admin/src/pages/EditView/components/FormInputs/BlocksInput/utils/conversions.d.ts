import { type Element, type Path, Editor } from 'slate';
/**
 * Extracts some logic that is common to most blocks' handleConvert functions.
 * @returns The path of the converted block
 */
declare const baseHandleConvert: <T extends import("@strapi/types/dist/schema/attribute").BlocksNode>(editor: Editor, attributesToSet: Partial<T> & {
    type: T['type'];
}) => void | Path;
/**
 * Set all attributes except type and children to null so that Slate deletes them
 */
declare const getAttributesToClear: (element: Element) => Record<string, null>;
export { baseHandleConvert, getAttributesToClear };
