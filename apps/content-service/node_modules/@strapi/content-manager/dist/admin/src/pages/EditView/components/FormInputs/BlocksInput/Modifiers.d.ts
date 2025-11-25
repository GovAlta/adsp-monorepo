import * as React from 'react';
import { type MessageDescriptor } from 'react-intl';
import { Editor, Text } from 'slate';
type ModifierKey = Exclude<keyof Text, 'type' | 'text'>;
type ModifiersStore = {
    [K in ModifierKey]: {
        icon: React.ComponentType;
        isValidEventKey: (event: React.KeyboardEvent<HTMLElement>) => boolean;
        label: MessageDescriptor;
        checkIsActive: (editor: Editor) => boolean;
        handleToggle: (editor: Editor) => void;
        renderLeaf: (children: React.JSX.Element | string) => React.JSX.Element;
    };
};
declare const modifiers: ModifiersStore;
export { type ModifiersStore, modifiers };
