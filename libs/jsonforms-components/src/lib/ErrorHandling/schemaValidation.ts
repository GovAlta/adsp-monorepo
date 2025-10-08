import { JsonSchema, UISchemaElement, hasType, isCategorization, isControl, isLayout } from '@jsonforms/core';
import {
  hasElements,
  isControlWithNoScope,
  isEmptyElements,
  isEmptyObject,
  isKnownType,
  isLayoutType,
  isListWithDetail,
  isNullSchema,
  isScopedPrefixed,
  isValidScope,
} from './errorCheck';

export const errCategorizationHasNonCategories = "Each element of 'Categorizations' must be of type 'Category'";
export const errCategorizationHasNoElements = 'A Categorization must contain Categories.';
export const errNoElements = (type: string) => `A ${type} must contain elements.`;
export const errMissingScope = 'A Control must have a scope';
export const errMalformedScope = (scope: string): string => `Scope ${scope} must be prefixed with '#/'.`;
export const errUnknownScope = (scope: string): string => `Failed to render: unknown scope ${scope}`;
export const errMissingType = 'UI schema element must have a type';
export const errUnknownType = (type: string) => `Unknown schema type: ${type}. (Names are case sensitive)`;
export const errMissingRegister = 'Register configuration is missing in the UISchema options';

export const getUISchemaErrors = (uiSchema: UISchemaElement, schema: JsonSchema): string | null => {
  // Sometimes the UISchema is null.  Ignore those cases, as all checks are done on the UIschema.
  if (isNullSchema(uiSchema)) {
    return null;
  }

  // silently ignore empty objects
  if (isEmptyObject(uiSchema)) {
    return '';
  }

  if (
    isControl(uiSchema) &&
    schema?.type === 'object' &&
    uiSchema?.options?.format === 'enum' &&
    uiSchema?.options?.register === undefined
  ) {
    return errMissingRegister;
  }

  // Check control elements
  if (isControl(uiSchema) && hasType(uiSchema, 'Control')) {
    if (!isScopedPrefixed(uiSchema.scope)) {
      return errMalformedScope(uiSchema.scope);
    }
    if (!isValidScope(uiSchema, schema)) {
      return errUnknownScope(uiSchema.scope);
    }
  }

  // isControl will fail if scope is not present, so make the test explicit...
  if (isControlWithNoScope(uiSchema)) {
    return errMissingScope;
  }

  if (isListWithDetail(uiSchema)) {
    if ('scope' in uiSchema) {
      const scope = uiSchema.scope as string;
      if (!isValidScope(uiSchema, schema)) {
        return errUnknownScope(scope);
      }
    } else {
      return errMissingScope;
    }
  }

  // Make an explicit check for Categorization, as this requires Category elements.
  // Is layout will fail if some of these conditions are not met, so we do that
  // check later.
  if (isCategorization(uiSchema)) {
    if (!hasElements(uiSchema)) {
      return errCategorizationHasNoElements;
    }

    // ensure each element has type Category, and that each category
    // has elements
    if (isLayout(uiSchema)) {
      const invalidCategorizations: string[] = [];
      const invalidCategories: UISchemaElement[] = [];
      (uiSchema.elements as UISchemaElement[]).forEach((e) => {
        if (e.type !== 'Category' && e.type !== 'Categorization') {
          invalidCategorizations.push(e.type);
        }
        if (!hasElements(e) || isEmptyElements(e)) {
          invalidCategories.push(e);
        }
      });
      if (invalidCategorizations.length > 0) {
        return errCategorizationHasNonCategories;
      }
      if (invalidCategories.length > 0) {
        return errNoElements('Category');
      }
    }
  }

  // Check layout
  if (isLayoutType(uiSchema)) {
    if (!hasElements(uiSchema)) {
      return errNoElements(uiSchema.type);
    }
    if (isEmptyElements(uiSchema)) {
      return errNoElements(uiSchema.type);
    }
  }

  if (!isKnownType(uiSchema)) {
    if (uiSchema.type === undefined || uiSchema.type.length < 1) {
      return errMissingType;
    }
    return errUnknownType(uiSchema.type);
  }

  return null;
};
