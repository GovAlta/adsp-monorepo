import * as React from 'react';
import { type FieldValue } from '@strapi/admin/strapi-admin';
import { MessageDescriptor } from 'react-intl';
import { Editor } from 'slate';
import { type RenderElementProps } from 'slate-react';
import { type CSSProperties } from 'styled-components';
import { type BlocksContentProps } from './BlocksContent';
import { type ModifiersStore } from './Modifiers';
import type { Schema } from '@strapi/types';
interface BaseBlock {
    renderElement: (props: RenderElementProps) => React.JSX.Element;
    matchNode: (node: Schema.Attribute.BlocksNode) => boolean;
    handleConvert?: (editor: Editor) => void | (() => React.JSX.Element);
    handleEnterKey?: (editor: Editor) => void;
    handleBackspaceKey?: (editor: Editor, event: React.KeyboardEvent<HTMLElement>) => void;
    handleTab?: (editor: Editor) => void;
    snippets?: string[];
    dragHandleTopMargin?: CSSProperties['marginTop'];
}
interface NonSelectorBlock extends BaseBlock {
    isInBlocksSelector: false;
}
interface SelectorBlock extends BaseBlock {
    isInBlocksSelector: true;
    icon: React.ComponentType;
    label: MessageDescriptor;
}
type NonSelectorBlockKey = 'list-item' | 'link';
declare const selectorBlockKeys: readonly ["paragraph", "heading-one", "heading-two", "heading-three", "heading-four", "heading-five", "heading-six", "list-ordered", "list-unordered", "image", "quote", "code"];
type SelectorBlockKey = (typeof selectorBlockKeys)[number];
declare const isSelectorBlockKey: (key: unknown) => key is "code" | "image" | "paragraph" | "quote" | "heading-one" | "heading-two" | "heading-three" | "heading-four" | "heading-five" | "heading-six" | "list-ordered" | "list-unordered";
type BlocksStore = {
    [K in SelectorBlockKey]: SelectorBlock;
} & {
    [K in NonSelectorBlockKey]: NonSelectorBlock;
};
interface BlocksEditorContextValue {
    blocks: BlocksStore;
    modifiers: ModifiersStore;
    disabled: boolean;
    name: string;
    setLiveText: (text: string) => void;
    isExpandedMode: boolean;
}
declare const BlocksEditorProvider: {
    (props: BlocksEditorContextValue & {
        children: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare function useBlocksEditorContext(consumerName: string): BlocksEditorContextValue & {
    editor: Editor;
};
interface BlocksEditorProps extends Pick<FieldValue<Schema.Attribute.BlocksValue>, 'onChange' | 'value' | 'error'>, BlocksContentProps {
    disabled?: boolean;
    name: string;
}
declare const BlocksEditor: React.ForwardRefExoticComponent<BlocksEditorProps & React.RefAttributes<{
    focus: () => void;
}>>;
export { type BlocksStore, type SelectorBlockKey, BlocksEditor, BlocksEditorProvider, useBlocksEditorContext, isSelectorBlockKey, };
