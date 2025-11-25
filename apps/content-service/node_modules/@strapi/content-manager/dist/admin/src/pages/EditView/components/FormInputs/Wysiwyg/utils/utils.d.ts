import { MutableRefObject } from 'react';
import CodeMirror from 'codemirror5';
export declare const replaceText: (markdownName: string, textToChange: string) => string;
export declare const insertText: (markdownName: string) => {
    editedText: string;
    selection: {
        start: number;
        end: number;
    };
};
export declare const insertListOrTitle: (markdown: string) => string;
export declare const markdownHandler: (editor: MutableRefObject<CodeMirror.EditorFromTextArea>, markdownType: string) => void;
export declare const listHandler: (editor: MutableRefObject<CodeMirror.EditorFromTextArea>, listType: string) => void;
export declare const titleHandler: (editor: MutableRefObject<CodeMirror.EditorFromTextArea>, titleType: string) => void;
export declare const insertFile: (editor: MutableRefObject<CodeMirror.EditorFromTextArea>, files: any[]) => void;
export declare const quoteAndCodeHandler: (editor: MutableRefObject<CodeMirror.EditorFromTextArea>, markdownType: string) => void;
