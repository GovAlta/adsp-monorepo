import type { CancellationToken, editor, IRange, languages, Position } from 'monaco-editor';
import { EditorSuggestion } from './autoComplete';
import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';

export class FormCompletionItemProvider implements languages.CompletionItemProvider {
  private scopeSuggestions: EditorSuggestion[];
  private refSuggestions: EditorSuggestion[];
  constructor(dataSchema: Record<string, unknown>) {
    this.scopeSuggestions = this.convertDataSchemaToSuggestion(dataSchema, '#');
    this.refSuggestions = [
      ...this.convertDataSchemaToSuggestion(standardV1JsonSchema, `${standardV1JsonSchema.$id}#`, 'standard.v1#'),
      ...this.convertDataSchemaToSuggestion(commonV1JsonSchema, `${commonV1JsonSchema.$id}#`, 'common.v1#'),
    ];
  }

  public triggerCharacters = ['"', '#', '/', ':', ' '];

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    const suggestions: languages.CompletionItem[] = [];
    try {
      const currentLine = model.getLineContent(position.lineNumber);
      const word = model.getWordAtPosition(position);
      const [scopeMatch, startScope, _pointer, endScope] =
        /"scope"\s*:\s*("?)([a-zA-Z0-9/#]{0,50})("?)$/.exec(currentLine) || [];
      if (scopeMatch) {
        let scopeSuggestions = this.scopeSuggestions;
        if (word) {
          const contextSuggestions = this.scopeSuggestions.filter(({ path }) => path.startsWith(word.word));
          if (contextSuggestions.length > 0) {
            scopeSuggestions = contextSuggestions;
          }
        }
        suggestions.push(
          ...this.mapSuggestions(
            {
              startLineNumber: position.lineNumber,
              startColumn: (word?.startColumn || position.column) - (startScope.length || 0),
              endLineNumber: position.lineNumber,
              endColumn: (word?.endColumn || position.column) + (endScope.length || 0),
            },
            scopeSuggestions
          )
        );
      }

      const [refMatch, startRef, _uri, endRef] = /"\$ref"\s*:\s*("?)([a-zA-Z0-9/#]{0,50})("?)$/.exec(currentLine) || [];
      if (refMatch) {
        let refSuggestions = this.refSuggestions;
        if (word) {
          const contextSuggestions = this.refSuggestions.filter(({ path }) => path.startsWith(word.word));
          if (contextSuggestions.length > 0) {
            refSuggestions = contextSuggestions;
          }
        }
        suggestions.push(
          ...this.mapSuggestions(
            {
              startLineNumber: position.lineNumber,
              startColumn: (word?.startColumn || position.column) - (startRef.length || 0),
              endLineNumber: position.lineNumber,
              endColumn: (word?.endColumn || position.column) + (endRef.length || 0),
            },
            refSuggestions
          )
        );
      }
    } catch (e) {
      console.debug(`Error in JSON editor autocompletion: ${e.message}`);
    }

    return {
      suggestions,
    } as languages.ProviderResult<languages.CompletionList>;
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

        suggestions.push({
          label: `"${currentLabelPath}"`,
          insertText: `"${currentPath}"`,
          path,
        });

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
        if (typeof schema.definitions[definition] === 'object') {
          const children = this.convertDataSchemaToSuggestion(
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
    for (const { label, insertText } of suggestions) {
      completionItems.push({
        label,
        // This cast is necessary since languages is imported as types only. Using regular import requires jest transform configuration.
        kind: 13 as languages.CompletionItemKind.Value,
        insertText,
        range,
      });
    }

    return completionItems;
  }
}
