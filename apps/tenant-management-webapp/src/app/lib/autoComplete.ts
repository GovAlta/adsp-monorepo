import type { EventDefinition } from '@store/event/models';
import { languages, editor, Position } from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';

export interface EditorSuggestion {
  label: string;
  insertText: string;
  children?: EditorSuggestion[];
}
const MAX_LINE_LENGTH = 10000;

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
export const convertToSuggestion = (event: EventDefinition, hasAddress: boolean) => {
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
      label: 'tenant',
      insertText: 'tenant',
      children: [
        {
          label: 'name',
          insertText: 'name',
        },
        {
          label: 'realm',
          insertText: 'realm',
        },
      ],
    },
  ];

  const subscriberEvents = [
    {
      label: 'managementUrl',
      insertText: 'managementUrl',
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
          label: 'id',
          insertText: 'id',
        },
        {
          label: 'userId ',
          insertText: 'userId ',
        },
      ],
    },
  ];
  return hasAddress ? eventSuggestion : [...eventSuggestion, ...subscriberEvents];
};

export const getElementSuggestion = (element) => {
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
const getPositionX = (text: string, search: string): number => {
  const textArr = text.split('\n');
  for (let i = textArr.length - 1; i >= 0; i--) {
    if (textArr[i].indexOf(search) > -1) {
      return i + 1;
    }
  }
  return MAX_LINE_LENGTH;
};
export const triggerInScope = (text: string, lineNumber: number) =>
  text.indexOf('{{') !== -1 && getPositionX(text, '{{') <= lineNumber && getPositionX(text, '{{') >= lineNumber;

export const luaTriggerInScope = (text: string, lineNumber: number) =>
  text.indexOf('[') !== -1 && getPositionX(text, '[') <= lineNumber && getPositionX(text, '[') >= lineNumber;

const isStringOrNumber = (value: unknown): value is string | number => {
  return typeof value === 'string' || typeof value === 'number';
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertEditorToSuggestion = (obj: any): EditorSuggestion => {
  const isArray = Array.isArray(obj);

  if (isArray) {
    return {
      label: 'Array',
      insertText: 'Array',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: obj.map((item: any) => convertEditorToSuggestion(item)),
    };
  } else if (typeof obj === 'object' && obj !== null) {
    const properties = Object.keys(obj).map((key) => {
      const value = obj[key];

      return isStringOrNumber(value)
        ? {
            label: String(value),
            insertText: String(value),
          }
        : {
            label: key,
            insertText: key,

            children: Array.isArray(value)
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value.map((item: any) => convertEditorToSuggestion(item))
              : convertEditorToSuggestion(value)?.children,
          };
    });

    return {
      label: 'Object',
      insertText: 'Object',
      children: properties,
    };
  } else {
    return {
      label: String(obj),
      insertText: String(obj),
    };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToEditorSuggestion = (obj: any): EditorSuggestion[] => {
  const suggest = convertEditorToSuggestion(obj);
  return [
    {
      label: 'data',
      insertText: 'data',
      children: suggest.children,
    },
  ];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertDataSchemaToSuggestion = (schema: any, monaco: Monaco): EditorSuggestion[] => {
  const suggestions = [];
  if (schema.properties) {
    for (const property in schema.properties) {
      if (
        typeof schema.properties[property]?.properties === 'object' &&
        schema.properties[property]?.properties !== null &&
        !Array.isArray(schema.properties[property].properties)
      ) {
        suggestions.push({
          label: property,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `/properties/${property}`,
          detail: 'Property',
          children: convertDataSchemaToSuggestion(schema.properties[property], monaco),
        });
      } else {
        suggestions.push({
          label: property,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `/properties/${property}`,
          detail: 'Property',
        });
      }
    }
  }
  return suggestions;
};

const flattenEditorSuggestions = (suggestions: EditorSuggestion[], parentInsertText = ''): EditorSuggestion[] => {
  let flattened: EditorSuggestion[] = [];

  for (const suggestion of suggestions) {
    // Concatenate parent insertText with current insertText
    const combinedInsertText = parentInsertText + suggestion.insertText;

    // Create a new object with combined insertText
    const flattenedSuggestion: EditorSuggestion = {
      ...suggestion,
      insertText: combinedInsertText,
    };

    // Add the current suggestion to the flattened list
    if (!suggestion.children) {
      flattened.push(flattenedSuggestion);
    }
    // If there are children, recursively flatten them
    if (suggestion.children && suggestion.children.length > 0) {
      const childSuggestions = flattenEditorSuggestions(suggestion.children, combinedInsertText);
      flattened = flattened.concat(childSuggestions);
    }
  }

  return flattened;
};

export const formatEditorSuggestions = (suggestions: EditorSuggestion[]): EditorSuggestion[] => {
  const flattenedSuggestions: EditorSuggestion[] = flattenEditorSuggestions(suggestions);
  for (const suggestion of flattenedSuggestions) {
    suggestion.insertText = `#${suggestion.insertText}`;
  }
  return flattenedSuggestions;
};
