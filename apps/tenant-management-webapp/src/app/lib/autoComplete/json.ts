import type { CancellationToken, editor, IRange, languages, Position } from 'monaco-editor';
import type { EditorSuggestion } from './autoComplete';

export abstract class JsonPropertyValueCompletionItemProvider implements languages.CompletionItemProvider {
  // These are only non-word characters that trigger completion.
  // "#" and "/" are expected as part of scope value and are entered as part of a word where they won't trigger anyways.
  public triggerCharacters = ['"', ':', ' '];
  protected propertyNames: string[];

  protected constructor(protected suggestions: Record<string, EditorSuggestion[]>) {
    this.propertyNames = Object.keys(suggestions);
  }

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    const suggestions: languages.CompletionItem[] = [];
    try {
      const line = model.getLineContent(position.lineNumber);
      for (const propertyName of this.propertyNames) {
        suggestions.push(
          ...this.providePropertyValueCompletionItem(
            // Expect the line to be a single property name and may or may not include current quoted string value.
            new RegExp(`^\\s*"${propertyName}"\\s*:\\s*("?)([a-zA-Z0-9/#]{0,50})("?)$`),
            this.suggestions[propertyName],
            line,
            position
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

  private mapSuggestions(range: IRange, suggestions: EditorSuggestion[]): languages.CompletionItem[] {
    const completionItems: languages.CompletionItem[] = [];
    for (const { label, insertText, path } of suggestions) {
      completionItems.push({
        label,
        kind: 13 as languages.CompletionItemKind,
        insertText,
        range,
        // Filter text is used when completion is triggered and there is a partial word.
        // In the json language model, the double quotes are part of the word pattern, so the word of a value is like "#/properties...
        // Include the leading quote so that the filter text will match in case completion is triggered against an existing scope.
        filterText: `"${path}/`,
        command: {
          id: 'editor.action.formatDocument',
          title: 'Format Document',
        },
      });
    }

    return completionItems;
  }
}

export type PeerContextType = 'property' | 'array' | 'unknown';
export abstract class JsonObjectCompletionItemProvider implements languages.CompletionItemProvider {
  protected constructor(protected lineExpression: RegExp, protected suggestions: EditorSuggestion[]) {}

  protected abstract shouldProvideItems(
    model: editor.ITextModel,
    position: Position,
    nextIndicates: PeerContextType
  ): boolean;

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    _context: languages.CompletionContext,
    _token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    // Get the next instance of ", {, }, or , to try to determine if we're in an array.
    const next = model.findNextMatch(',?\\s*("|\\{|\\}|\\])', position, true, false, null, true);
    let nextIndicates: PeerContextType;
    switch (next?.matches?.[1]) {
      // If next is a " or }, then that suggests next is a property or end of object and we're defining a property.
      case '"':
      case '}':
        nextIndicates = 'property';
        break;
      // If next is a { or ], then that suggests next is a peer object or end of array and we're defining an object in an array.
      case '{':
      case ']':
        nextIndicates = 'array';
        break;
      default:
        nextIndicates = 'unknown';
        break;
    }

    const suggestions: languages.CompletionItem[] = [];
    if (this.shouldProvideItems(model, position, nextIndicates)) {
      const line = model.getValueInRange({
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: 1,
        endColumn: position.column,
      });

      // Expect line with either a closing peer object, or start of elements array.
      const [match, peerStart, parentStart] = line.match(this.lineExpression) || [];
      if (match) {
        suggestions.push(
          ...this.mapSuggestions(
            {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column - (peerStart?.length || parentStart?.length || 0),
              endColumn: position.column,
            },
            this.suggestions,
            // Add trailing comma if next is a start of a peer object or property.
            next?.matches?.[0].startsWith(',') !== true && (next.matches?.[1] === '{' || next.matches?.[1] === '"')
          )
        );
      }
    }

    return {
      suggestions,
    };
  }

  private mapSuggestions(
    range: IRange,
    suggestions: EditorSuggestion[],
    addTrailingComma: boolean
  ): languages.CompletionItem[] {
    const completionItems: languages.CompletionItem[] = [];
    for (const { label, insertText } of suggestions) {
      completionItems.push({
        label,
        kind: 27 as languages.CompletionItemKind,
        insertText: addTrailingComma ? insertText + ',' : insertText,
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
