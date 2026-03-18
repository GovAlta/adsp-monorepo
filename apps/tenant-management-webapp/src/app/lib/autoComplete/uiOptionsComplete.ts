import type { Monaco } from '@monaco-editor/react';
import type { languages, editor, Position } from 'monaco-editor';
import { predictiveOptionsMonaco } from '@abgov/jsonforms-components';

type PredictiveOption = {
  label: string;
  insertText: string;
};

export const createOptionsCompletionProvider = (monaco: Monaco) => ({
  triggerCharacters: ['"'],

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
  ): languages.ProviderResult<languages.CompletionList> {
    const fullText = model.getValue();
    const cursorOffset = model.getOffsetAt(position);
    const beforeCursor = fullText.slice(0, cursorOffset);

    const optionsIndex = beforeCursor.lastIndexOf('"options"');
    if (optionsIndex === -1) {
      return { suggestions: [] };
    }

    const afterOptions = fullText.slice(optionsIndex);
    const openBraceIndex = afterOptions.indexOf('{');
    if (openBraceIndex === -1) {
      return { suggestions: [] };
    }

    const absoluteOpenBrace = optionsIndex + openBraceIndex;

    const textBetween = fullText.slice(absoluteOpenBrace, cursorOffset);

    let braceCount = 0;
    for (const char of textBetween) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    if (braceCount <= 0) {
      return { suggestions: [] };
    }

    return {
      suggestions: (predictiveOptionsMonaco as PredictiveOption[]).map((prop) => ({
        label: prop.label,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: prop.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
      })),
    };
  },
});
