import type { Monaco } from '@monaco-editor/react';
import type { languages, editor, Position } from 'monaco-editor';

import { autoPopulatePropertiesMonaco } from '@abgov/jsonforms-components';

type PredictiveOption = {
  label: string;
  insertText: string;
};

export const createPropertiesCompletionProvider = (monaco: Monaco): languages.CompletionItemProvider => ({
  triggerCharacters: ['"'],

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
  ): languages.ProviderResult<languages.CompletionList> {
    const fullText = model.getValue();
    const offset = model.getOffsetAt(position);
    const beforeCursor = fullText.slice(0, offset);

    const propertiesIndex = beforeCursor.lastIndexOf('"properties"');
    if (propertiesIndex === -1) return { suggestions: [] };

    const braceIndex = beforeCursor.indexOf('{', propertiesIndex);
    if (braceIndex === -1 || braceIndex > offset) return { suggestions: [] };

    const textBetween = beforeCursor.slice(braceIndex, offset);
    const openBraces = (textBetween.match(/{/g) || []).length;
    const closeBraces = (textBetween.match(/}/g) || []).length;

    if (openBraces <= closeBraces) return { suggestions: [] }; // cursor is outside

    return {
      suggestions: (autoPopulatePropertiesMonaco as PredictiveOption[]).map((prop) => ({
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
