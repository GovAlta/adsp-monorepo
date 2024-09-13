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
  static layoutUIelements: EditorSuggestion[];
  static {
    const elements = [
      { type: 'Categorization', options: { variant: 'stepper', elements: [] } },
      { type: 'Category', label: 'Step label', elements: [] },
      { type: 'Group', label: 'Group label', elements: [] },
      { type: 'VerticalLayout', elements: [] },
      { type: 'HorizontalLayout', elements: [] },
      { type: 'HelpContent', label: 'Help label', options: { help: 'Provide help content here.' }, elements: [] },
    ];

    FormUISchemaElementCompletionItemProvider.layoutUIelements = elements.map((element) => ({
      label: element.type,
      insertText: JSON.stringify(element, null, 2),
    }));
  }

  public triggerCharacters = [',', '[', '{', ' '];
  private suggestions: EditorSuggestion[];

  constructor(dataSchema: Record<string, unknown>) {
    this.suggestions = [
      ...FormUISchemaElementCompletionItemProvider.layoutUIelements,
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
    // Get the next instance of ", {, or ] to determine if we're in an array.
    const next = model.findNextMatch('"|\\{|\\]', position, true, false, null, true);

    const suggestions: languages.CompletionItem[] = [];
    if (result && next?.matches?.[0] !== '"') {
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
            this.suggestions.map(({ insertText, ...suggestion }) => ({
              ...suggestion,
              // Add trailing comma if the next is a peer object.
              insertText: next?.matches?.[0] === '{' ? insertText + ',' : insertText,
            }))
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
      for (const propertyName in schema.properties) {
        const currentPath = `${path}/properties/${propertyName}`;
        const currentLabelPath = `${labelPath || path}/p.../${propertyName}`;

        const property = schema.properties[propertyName];
        switch (property?.type) {
          case 'boolean':
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}", "options": { "radio": false } }`,
              path,
            });
            break;
          case 'string': {
            if (property.enum || property.format) {
              suggestions.push({
                label: `Control:"${currentLabelPath}"`,
                insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
                path,
              });
            } else {
              suggestions.push({
                label: `Control:"${currentLabelPath}"`,
                insertText: `{ "type": "Control", "scope": "${currentPath}", "options": { "multi": false } }`,
                path,
              });
            }
            break;
          }
          case 'number':
          case 'integer':
          case 'array':
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
              path,
            });
            break;
          case 'object':
          default:
            break;
        }

        // Resolve children if current property is an object.
        if (typeof schema.properties[propertyName] === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            schema.properties[propertyName],
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
