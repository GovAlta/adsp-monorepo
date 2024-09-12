import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';
import type { CancellationToken, editor, IRange, languages, Position } from 'monaco-editor';
import type { EditorSuggestion } from './autoComplete';
import { JsonPropertyValueCompletionItemProvider } from './json';

export class FormPropertyValueCompletionItemProvider extends JsonPropertyValueCompletionItemProvider {
  constructor(dataSchema: Record<string, unknown>) {
    const scopeSuggestions = FormPropertyValueCompletionItemProvider.convertDataSchemaToSuggestion(
      true,
      dataSchema,
      '#'
    );
    const refSuggestions = [
      ...FormPropertyValueCompletionItemProvider.convertDataSchemaToSuggestion(
        false,
        standardV1JsonSchema,
        `${standardV1JsonSchema.$id}#`,
        'standard.v1#'
      ),
      ...FormPropertyValueCompletionItemProvider.convertDataSchemaToSuggestion(
        false,
        commonV1JsonSchema,
        `${commonV1JsonSchema.$id}#`,
        'common.v1#'
      ),
    ];

    super({ scope: scopeSuggestions, '\\$ref': refSuggestions });
  }

  private static convertDataSchemaToSuggestion(
    recurse: boolean,
    schema: Record<string, unknown>,
    path: string,
    labelPath?: string
  ): EditorSuggestion[] {
    const suggestions: EditorSuggestion[] = [];
    if (typeof schema?.properties === 'object') {
      for (const property in schema.properties) {
        const currentPath = `${path}/properties/${property}`;
        const currentLabelPath = `${labelPath || path}/p.../${property}`;

        suggestions.push({
          label: `"${currentLabelPath}"`,
          insertText: `"${currentPath}"`,
          path,
        });

        // Resolve children if current property is an object.
        if (recurse && typeof schema.properties[property] === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            recurse,
            schema.properties[property],
            currentPath,
            currentLabelPath
          );
          suggestions.push(...children);
        }
      }
    }

    if (typeof schema?.definitions === 'object') {
      for (const definition in schema.definitions) {
        const currentPath = `${path}/definitions/${definition}`;
        const currentLabelPath = `${labelPath || path}/d.../${definition}`;

        suggestions.push({
          label: `"${currentLabelPath}"`,
          insertText: `"${currentPath}"`,
          path,
        });

        // Resolve children if current definition is an object.
        if (recurse && typeof schema.definitions[definition] === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            recurse,
            schema.definitions[definition],
            currentPath,
            currentLabelPath
          );
          suggestions.push(...children);
        }
      }
    }

    return suggestions;
  }
}

export class FormUISchemaElementCompletionItemProvider implements languages.CompletionItemProvider {
  public triggerCharacters = [',', '[', '{'];
  private suggestions: EditorSuggestion[];

  constructor(dataSchema: Record<string, unknown>) {
    this.suggestions = [
      {
        label: 'Categorization',
        insertText: '{ "type": "Categorization", "elements": [] },',
      },
      {
        label: 'Group',
        insertText: '{ "type": "Categorization", "elements": [] },',
      },
      {
        label: 'VerticalLayout',
        insertText: '{ "type": "VerticalLayout", "elements": [] },',
      },
      {
        label: 'HorizontalLayout',
        insertText: '{ "type": "HorizontalLayout", "elements": [] },',
      },
      ...this.convertDataSchemaToSuggestion(dataSchema, '#'),
    ];
  }

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    // Find UI schema types to determine if we're in a UI schema (completion provider is global for monaco instances)
    const result = model.findPreviousMatch(
      '("VerticalLayout|HorizontalLayout|Group|Categorization")',
      position,
      true,
      true,
      null,
      false
    );

    const suggestions: languages.CompletionItem[] = [];
    if (result) {
      const line = model.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: 1,
        endColumn: position.column,
      });

      // Expect line with either a closing peer object, or start of elements array.
      const [match, peerStart, parentStart] = line.match(/^\s*(?:}, ?({?)|"elements": ?\[({?))$/) || [];
      if (match) {
        suggestions.push(
          ...this.mapSuggestions(
            {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - (peerStart?.length || parentStart?.length || 0),
              endColumn: position.column,
            },
            this.suggestions
          )
        );
      }
    }

    return {
      suggestions,
    };
  }

  private convertDataSchemaToSuggestion(
    schema: Record<string, unknown>,
    path: string,
    labelPath?: string
  ): EditorSuggestion[] {
    const suggestions: EditorSuggestion[] = [];
    if (typeof schema?.properties === 'object') {
      for (const property in schema.properties) {
        const currentPath = `${path}/properties/${property}`;
        const currentLabelPath = `${labelPath || path}/p.../${property}`;

        switch (schema.properties[property]?.type) {
          case 'boolean':
          case 'number':
          case 'integer':
          case 'string':
          case 'array':
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}" },`,
              path,
            });
            break;
          case 'object':
          default:
            break;
        }

        // Resolve children if current property is an object.
        if (typeof schema.properties[property] === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            schema.properties[property],
            currentPath,
            currentLabelPath
          );
          suggestions.push(...children);
        }
      }
    }

    return suggestions;
  }

  private mapSuggestions(range: IRange, suggestions: EditorSuggestion[]): languages.CompletionItem[] {
    const completionItems: languages.CompletionItem[] = [];
    for (const { label, insertText } of suggestions) {
      completionItems.push({
        label,
        kind: 27 as languages.CompletionItemKind,
        insertText,
        range,
        filterText: '',
        command: {
          id: 'editor.action.formatDocument',
          title: 'Format Document',
        },
      });
    }

    return completionItems;
  }
}
