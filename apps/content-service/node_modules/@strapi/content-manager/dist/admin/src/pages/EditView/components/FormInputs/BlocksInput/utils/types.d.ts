import type { Schema } from '@strapi/types';
import type { Element, Node } from 'slate';
type Block<T extends Element['type']> = Extract<Node, {
    type: T;
}>;
declare const getEntries: <T extends object>(object: T) => [keyof T, T[keyof T]][];
declare const getKeys: <T extends object>(object: T) => (keyof T)[];
declare const isLinkNode: (element: Element) => element is Schema.Attribute.LinkInlineNode;
declare const isListNode: (element: Element) => element is Schema.Attribute.ListBlockNode;
export { type Block, getEntries, getKeys, isLinkNode, isListNode };
