import type { CancellationToken, editor, IRange, languages, Position } from 'monaco-editor';
import { EditorSuggestion } from './autoComplete';
import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';

export class FormCompletionItemProvider implements languages.CompletionItemProvider {
  private scopeSuggestions: EditorSuggestion[];
  private refSuggestions: EditorSuggestion[];
  constructor(dataSchema: Record<string, unknown>) {
    this.scopeSuggestions = this.convertDataSchemaToSuggestion(true, dataSchema, '#');
    this.refSuggestions = [
      ...this.convertDataSchemaToSuggestion(false, standardV1JsonSchema, `${standardV1JsonSchema.$id}#`, 'standard.v1#'),
      ...this.convertDataSchemaToSuggestion(false, commonV1JsonSchema, `${commonV1JsonSchema.$id}#`, 'common.v1#'),
    ];
  }

  // These are only non-word characters that trigger completion.
  // "#" and "/" are expected as part of scope value and are entered as part of a word where they won't trigger anyways.
  public triggerCharacters = ['"', ':', ' '];

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    const suggestions: languages.CompletionItem[] = [];
    try {
      const line = model.getLineContent(position.lineNumber);
      suggestions.push(
        ...this.providePropertyValueCompletionItem(
          /"scope"\s*:\s*("?)([a-zA-Z0-9/#]{0,50})("?)$/,
          this.scopeSuggestions,
          line,
          position
        )
      );

      suggestions.push(
        ...this.providePropertyValueCompletionItem(
          /"\$ref"\s*:\s*("?)([a-zA-Z0-9/:#.]{0,50})("?)$/,
          this.refSuggestions,
          line,
          position
        )
      );
    } catch (e) {
      console.debug(`Error in JSON editor autocompletion: ${e.message}`);
    }

    return {
      suggestions,
    } as languages.ProviderResult<languages.CompletionList>;
  }

  private providePropertyValueCompletionItem(
    valueExpression: RegExp,
    suggestions: EditorSuggestion[],
    line: string,
    position: Position
  ): languages.CompletionItem[] {
    const [match, openQuote, value, closeQuote] = valueExpression.exec(line) || [];
    if (match) {
      // 1 based index of columns for replacement.
      // Use the regex capture groups to determine column values for replacement range.
      // NOTE: This doesn't handle multiple occurrences of a property on the same line.
      const startColumn = (value ? line.indexOf(value) + 1 : position.column) - (openQuote?.length || 0);
      const endColumn = (value ? line.indexOf(value) + 1 + value.length : position.column) + (closeQuote?.length || 0);

      return this.mapSuggestions(
        {
          startLineNumber: position.lineNumber,
          startColumn,
          endLineNumber: position.lineNumber,
          endColumn,
        },
        suggestions
      );
    } else {
      return [];
    }
  }

  private convertDataSchemaToSuggestion(
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

  private mapSuggestions(range: IRange, suggestions: EditorSuggestion[]): languages.CompletionItem[] {
    const completionItems: languages.CompletionItem[] = [];
    for (const { label, insertText, path } of suggestions) {
      completionItems.push({
        label,
        // This cast is necessary since languages is imported as types only. Using regular import requires jest transform configuration.
        kind: 13 as languages.CompletionItemKind.Value,
        insertText,
        range,
        // Filter text is used when completion is triggered and there is a partial word.
        // In the json language model, the double quotes are part of the word pattern, so the word of a value is like "#/properties...
        // Include the leading quote so that the filter text will match in case completion is triggered against an existing scope.
        filterText: `"${path}/`,
      });
    }

    return completionItems;
  }
}
