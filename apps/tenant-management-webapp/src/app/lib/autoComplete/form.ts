import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';
import type { editor, Position } from 'monaco-editor';
import type { EditorSuggestion } from './autoComplete';
import { JsonObjectCompletionItemProvider, JsonPropertyValueCompletionItemProvider, PeerContextType } from './json';

export class FormPropertyValueCompletionItemProvider extends JsonPropertyValueCompletionItemProvider {
  private static standardValues: EditorSuggestion[];
  static {
    FormPropertyValueCompletionItemProvider.standardValues = [
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
  }

  constructor(dataSchema: Record<string, unknown>) {
    const scopeSuggestions = FormPropertyValueCompletionItemProvider.convertDataSchemaToSuggestion(
      true,
      dataSchema,
      '#'
    );

    super({ scope: scopeSuggestions, '\\$ref': FormPropertyValueCompletionItemProvider.standardValues });
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
        const propertySchema = schema.properties[property];

        const isParentRef = (currentPath.match(/properties/g) || []).length === 1;

        const hasNoRefChildren = 'properties' in propertySchema && isParentRef;

        if (recurse && typeof schema.properties[property] === 'object' && hasNoRefChildren) {
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

export class FormUISchemaElementCompletionItemProvider extends JsonObjectCompletionItemProvider {
  private static layoutUIelements: EditorSuggestion[];
  static {
    const elements = [
      { type: 'Categorization', options: { variant: 'stepper' }, elements: [] },
      { type: 'Category', label: 'Step label', elements: [] },
      { type: 'Group', label: 'Group label', elements: [] },
      { type: 'VerticalLayout', elements: [] },
      { type: 'HorizontalLayout', elements: [] },
      { type: 'HelpContent', label: 'Help label', options: { help: 'Provide help content here.' } },
    ];

    FormUISchemaElementCompletionItemProvider.layoutUIelements = elements.map((element) => ({
      label: element.type,
      insertText: JSON.stringify(element, null, 2),
    }));
  }

  public triggerCharacters = [',', '[', '{', ' '];

  constructor(dataSchema: Record<string, unknown>) {
    super(/^\s*(?:}, ?({?)|"elements": ?\[({?))$/, [
      ...FormUISchemaElementCompletionItemProvider.layoutUIelements,
      ...FormUISchemaElementCompletionItemProvider.convertDataSchemaToSuggestion(dataSchema, '#'),
    ]);
  }

  protected override shouldProvideItems(
    model: editor.ITextModel,
    position: Position,
    nextIndicates: PeerContextType
  ): boolean {
    // Find UI schema types to determine if we're in a UI schema (completion provider is global for monaco instances)
    const result = model.findPreviousMatch(
      '("VerticalLayout|HorizontalLayout|Group|Categorization")',
      position,
      true,
      true,
      null,
      false
    );

    return result && nextIndicates === 'array';
  }

  private static convertDataSchemaToSuggestion(
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
            if (property.enum || property.format || property.pattern) {
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
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
              path,
            });
            break;
          case 'array':
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
              path,
            });

            if (property?.items?.type === 'object') {
              suggestions.push({
                label: `ListWithDetail:"${currentLabelPath}"`,
                insertText: `{ "type": "ListWithDetail", "scope": "${currentPath}" }`,
                path,
              });
            }
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
}

export class FormDataSchemaElementCompletionItemProvider extends JsonObjectCompletionItemProvider {
  private static standardElements: EditorSuggestion[];
  static {
    FormDataSchemaElementCompletionItemProvider.standardElements = [
      ...FormDataSchemaElementCompletionItemProvider.convertDataSchemaToSuggestion(
        standardV1JsonSchema,
        `${standardV1JsonSchema.$id}#`,
        'standard.v1#'
      ),
      ...FormDataSchemaElementCompletionItemProvider.convertDataSchemaToSuggestion(
        commonV1JsonSchema,
        `${commonV1JsonSchema.$id}#`,
        'common.v1#'
      ),
    ];
  }

  public triggerCharacters = [':', '{', ' '];

  constructor() {
    super(/^\s*(?:"[a-zA-Z0-9_-]{1,100}": ?({?))$/, FormDataSchemaElementCompletionItemProvider.standardElements);
  }

  protected override shouldProvideItems(
    model: editor.ITextModel,
    position: Position,
    nextIndicates: PeerContextType
  ): boolean {
    // Find data schema types to determine if we're in a data schema (completion provider is global for monaco instances)
    const result = model.findPreviousMatch(
      '("object|boolean|number|integer|string")',
      position,
      true,
      true,
      null,
      false
    );

    return result && nextIndicates === 'property';
  }

  private static convertDataSchemaToSuggestion(
    schema: Record<string, unknown>,
    path: string,
    labelPath?: string
  ): EditorSuggestion[] {
    const suggestions: EditorSuggestion[] = [];
    if (typeof schema?.definitions === 'object') {
      for (const definition in schema.definitions) {
        const currentPath = `${path}/definitions/${definition}`;
        const currentLabelPath = `${labelPath || path}/d.../${definition}`;

        suggestions.push({
          label: `Ref:"${currentLabelPath}"`,
          insertText: `{ "$ref": "${currentPath}" }`,
          path,
        });
      }
    }

    return suggestions;
  }
}
