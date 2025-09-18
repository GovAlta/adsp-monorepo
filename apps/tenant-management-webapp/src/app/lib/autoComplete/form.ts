import { commonV1JsonSchema, standardV1JsonSchema } from '@abgov/data-exchange-standard';
import { isAddressLookup, isFullName, isFullNameDoB } from '@abgov/jsonforms-components';
import { TesterContext } from '@jsonforms/core';
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
        standardV1JsonSchema,
        `${standardV1JsonSchema.$id}#`,
        'standard.v1#'
      ),
      ...FormPropertyValueCompletionItemProvider.convertDataSchemaToSuggestion(
        false,
        commonV1JsonSchema,
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
      dataSchema,
      '#'
    );

    super({ scope: scopeSuggestions, '\\$ref': FormPropertyValueCompletionItemProvider.standardValues });
  }

  private static convertDataSchemaToSuggestion(
    recurse: boolean,
    rootSchema: Record<string, unknown>,
    schema: Record<string, unknown>,
    path: string,
    labelPath?: string
  ): EditorSuggestion[] {
    const suggestions: EditorSuggestion[] = [];
    if (typeof schema?.properties === 'object') {
      for (const propertyName in schema.properties) {
        const property = schema.properties[propertyName];
        const currentPath = `${path}/properties/${propertyName}`;
        const currentLabelPath = `${labelPath || path}/p.../${propertyName}`;
        const uiSchema = {
          type: 'Control',
          scope: currentPath,
        };
        const dummyTestContext = {
          rootSchema,
          config: {},
        } as TesterContext;

        const isRef =
          isAddressLookup(uiSchema, rootSchema, dummyTestContext) ||
          isFullName(uiSchema, rootSchema, dummyTestContext) ||
          isFullNameDoB(uiSchema, rootSchema, dummyTestContext);

        if (property?.type !== 'object' || isRef)
          suggestions.push({
            label: `"${currentLabelPath}"`,
            insertText: `"${currentPath}"`,
            path,
          });

        // Resolve children if current property is an object.
        if (recurse && typeof property === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            recurse,
            rootSchema,
            property,
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
            schema,
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
      { type: 'HelpContent', label: 'Help label', options: { help: 'Provide help content here.', markdown: false } },
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
      ...FormUISchemaElementCompletionItemProvider.convertDataSchemaToSuggestion(dataSchema, dataSchema, '#'),
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
    rootSchema: Record<string, unknown>,
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
          case 'object': {
            const uiSchema = {
              type: 'Control',
              scope: currentPath,
            };
            const dummyTestContext = {
              rootSchema,
              config: {},
            } as TesterContext;

            // For known ref schemas of type object, include a control binding.
            if (
              isAddressLookup(uiSchema, rootSchema, dummyTestContext) ||
              isFullName(uiSchema, rootSchema, dummyTestContext) ||
              isFullNameDoB(uiSchema, rootSchema, dummyTestContext)
            ) {
              suggestions.push({
                label: `Control:"${currentLabelPath}"`,
                insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
                path,
              });
            }
            break;
          }
          default:
            // Add a basic control binding by default.
            // This covers cases where the property schema doesn't explicitly include type.
            suggestions.push({
              label: `Control:"${currentLabelPath}"`,
              insertText: `{ "type": "Control", "scope": "${currentPath}" }`,
              path,
            });
            break;
        }

        // Resolve children if current property is an object.
        // Note: Not based the schema type value since the value might be composed via other keywords like allOf.
        if (typeof property === 'object') {
          const children = this.convertDataSchemaToSuggestion(
            rootSchema,
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
    if (schema?.definitions && typeof schema.definitions === 'object') {
      const definitions = schema.definitions;
      for (const [definition, definitionSchema] of Object.entries(definitions)) {
        const currentPath = `${path}/definitions/${definition}`;
        const currentLabelPath = `${labelPath || path}/d.../${definition}`;

        if (definitionSchema.deprecated !== true) {
          suggestions.push({
            label: `Ref:"${currentLabelPath}"`,
            insertText: `{ "$ref": "${currentPath}" }`,
            path,
          });
        }
      }
    }

    return suggestions;
  }
}
