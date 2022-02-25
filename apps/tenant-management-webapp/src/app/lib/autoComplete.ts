import type { EventDefinition } from '@store/event/models';
import { languages, editor, Position } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
export interface EditorSuggestion {
  label: string;
  insertText: string;
  children?: EditorSuggestion[];
}

const createSuggestion = (instance: Monaco, suggestion: EditorSuggestion, hasBracket: boolean, hasParent = false) => {
  const showSuggest = suggestion.children?.length;
  let insertBrackets = false;

  let insertText = suggestion.insertText;
  if (showSuggest) {
    insertText = `${suggestion.insertText}.`;
    insertBrackets = !hasParent;
  } else {
    if (hasParent) {
      insertText = `${suggestion.insertText} `;
    } else {
      insertText = `${suggestion.insertText} `;
      insertBrackets = true;
    }
  }

  if (insertBrackets) {
    const bracks = hasBracket ? '{' : '{{';
    insertText = `${bracks}${insertText}`;
  }

  return {
    label: suggestion.label,
    kind: instance.languages.CompletionItemKind.Variable,
    insertText,
    ...(showSuggest
      ? {
          command: {
            id: 'editor.action.triggerSuggest',
          },
        }
      : {}),
    range: null,
  } as languages.CompletionItem;
};
// eslint-disable-next-line
export const buildSuggestions = (
  instance: Monaco,
  suggestions: EditorSuggestion[],
  model: editor.ITextModel,
  position: Position
) => {
  let results: EditorSuggestion[] = [];
  let hasParent = false;

  const prevChar = model.getValueInRange({
    startColumn: position.column - 1,
    startLineNumber: position.lineNumber,
    endColumn: position.column,
    endLineNumber: position.lineNumber,
  });

  const hasBracket = prevChar === '{';

  const word = model.getWordUntilPosition(position);
  let text = word.word;

  const prev = model.findPreviousMatch(
    '{',
    {
      lineNumber: 0,
      column: 0,
    },
    false,
    false,
    null,
    true
  );

  if (prev) {
    text = model.getValueInRange({
      ...prev.range,
      endColumn: position.column,
    });
  }

  text = text.replace('{', '').trim();

  if (text.length === 0) {
    results = suggestions;
  } else {
    const splits = text.split('.').filter((s) => s.trim() !== '');

    if (splits.length) {
      hasParent = true;

      let i = 0;
      let children = suggestions;
      const dotEnd = text[text.length - 1] === '.';

      for (const split of splits) {
        const found = children.find((c) => c.insertText === split);
        const isLast = splits.length - 1 === i++;

        if (dotEnd) {
          if (found?.children?.length) {
            children = found.children;

            if (isLast) {
              results = children;
            }
          }
        } else {
          if (found) {
            if (isLast) {
              children = children.filter((s) => s.insertText.includes(text));
            } else if (found.children) {
              children = found.children;
            }
          }
        }
      }

      results = children;
    } else {
      results = suggestions.filter((s) => s.insertText.includes(text));
    }
  }

  return results.map((s) => createSuggestion(instance, s, hasBracket, hasParent)) as languages.CompletionItem[];
};
// eslint-disable-next-line
export const convertToSuggestion = (event: EventDefinition) => {
  const eventPayload = getElementSuggestion(event.payloadSchema);
  const eventSuggestion = [
    {
      label: 'event',
      insertText: 'event',
      children: [
        {
          label: 'payload',
          insertText: 'payload',
          children: eventPayload,
        },
      ],
    },
    {
      label: 'subscriber',
      insertText: 'subscriber',
      children: [
        {
          label: 'addressAs',
          insertText: 'addressAs',
        },
        {
          label: 'channel',
          insertText: 'channel',
        },
        {
          label: 'address',
          insertText: 'address',
        },
      ],
    },
  ];
  return eventSuggestion;
};

const getElementSuggestion = (element) => {
  const suggest = [];

  for (const k in element?.properties) {
    if (element.properties[k]?.type === 'object') {
      const child = getElementSuggestion(element.properties[k]);

      suggest.push({ label: k, insertText: k, children: child });
    } else {
      suggest.push({ label: k, insertText: k });
    }
  }
  return suggest;
};
