import React from 'react';
import {
  ControlProps,
  JsonSchema,
  RankedTester,
  UISchemaElement,
  hasType,
  isCategorization,
  isControl,
  isLayout,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  hasElements,
  hasVariant,
  isControlWithNoScope,
  isEmptyElements,
  isEmptyObject,
  isKnownType,
  isLayoutType,
  isListWithDetail,
  isMissingProperties,
  isNullSchema,
  isScopedPrefixed,
  isValidScope,
} from './errorChecks';

/**
 * The error control is invoked whenever no other control can be found.  It is used to display
 * an error to the developers indicating that they have misconfigured one or more of their schemas and
 * that they need to take a close look.  It will attempt to provide information to guide the developer
 * toward fixing the error.
 */

const isValidUiSchema = (uiSchema: UISchemaElement, schema: JsonSchema): string | null => {
  // Sometimes the UISchema is null.  Ignore those cases, as all checks are done on the UIschema.
  if (isNullSchema(uiSchema)) {
    return null;
  }

  // silently ignore empty objects
  if (isEmptyObject(uiSchema)) {
    return '';
  }

  // Check control elements
  if (isControl(uiSchema) && hasType(uiSchema, 'Control')) {
    if (!isScopedPrefixed(uiSchema.scope)) {
      return `Scope ${uiSchema.scope} must be prefixed with '#/'.`;
    }
    if (!isValidScope(uiSchema, schema)) {
      return `Failed to render: unknown scope ${uiSchema.scope}`;
    }
  }

  // isControl will fail if scope is not present, so make the test explicit...
  if (isControlWithNoScope(uiSchema)) {
    return 'Failed to render: a Control must have a scope';
  }

  if (isListWithDetail(uiSchema)) {
    if ('scope' in uiSchema) {
      if (!isValidScope(uiSchema, schema)) {
        return `Failed to render ListWithDetail: scope ${uiSchema.scope} is not valid`;
      }
    } else {
      return 'Failed to render ListWithDetail: scope is required';
    }
  }

  // Make an explicit check for Categorization, as this requires Category elements.
  // Is layout will fail if some of these conditions are not met, so we do that
  // check later.
  if (isCategorization(uiSchema)) {
    if (!hasElements(uiSchema)) {
      return 'A Categorization must contain Categories.';
    }

    if (!hasVariant(uiSchema)) {
      return 'A Categorization must contain Options with a variant.';
    }

    // ensure each element has type Category, and that each category
    // has elements
    if (isLayout(uiSchema)) {
      const invalidCategorizations: string[] = [];
      const invalidCategories: UISchemaElement[] = [];
      (uiSchema.elements as UISchemaElement[]).forEach((e) => {
        if (e.type !== 'Category') {
          invalidCategorizations.push(e.type);
        }
        if (!hasElements(e)) {
          invalidCategories.push(e);
        }
      });
      if (invalidCategorizations.length > 0) {
        return "Each element of 'Categorizations' must be of type 'Category'";
      }
      if (invalidCategories.length > 0) {
        return 'Please ensure each Category has elements';
      }
    }
  }

  // Check layout
  if (isLayoutType(uiSchema)) {
    if (!hasElements(uiSchema)) {
      return `A ${uiSchema.type} must contain elements.`;
    }
    if (isEmptyElements(uiSchema)) {
      return '';
    }
  }

  if (!isKnownType(uiSchema)) {
    if (uiSchema.type === undefined || uiSchema.type.length < 1) {
      return `UI schema element must have a type`;
    }
    return `Unknown schema type: ${uiSchema.type}. (Note: Names are case sensitive)`;
  }

  return null;
};

const getMissingType = (schema: JsonSchema, parent?: string): string | null => {
  if (typeof schema === 'object') {
    const keys = Object.keys(schema);
    // empty objects don't count; they are valid.
    if (keys.length > 0 && !('type' in schema)) {
      return `object '${parent || 'schema'}' must have a 'type' property`;
    }

    if (schema.type === 'object' && 'properties' in schema) {
      const props = schema.properties || {};
      for (const key of Object.keys(props)) {
        const err = getMissingType(props[key], key);
        if (err) {
          return err;
        }
      }
    }
  }
  return null;
};

const isValidJsonSchema = (schema: JsonSchema): string | null => {
  // if (isMissingProperties(schema)) {
  //   return 'Please define properties on your object.';
  // }
  // const err = getMissingType(schema);
  // if (err) {
  //   return err;
  // }
  return null;
};

// Some 'errors' need not be reported, but we want to handle them
// here.  e.g.  A layout with empty elements should be quietly ignored.
// this is handled by the errors !== '' check.
const ErrorControl = (props: ControlProps): JSX.Element => {
  const { schema, uischema } = props;
  // Report data schema errors over ui schema ones, as errors in the former
  // can cause cascading errors in the latter.
  const dataSchemaErrors = isValidJsonSchema(schema);
  if (dataSchemaErrors && dataSchemaErrors !== '') {
    return <p>{dataSchemaErrors}</p>;
  }
  const uiSchemaErrors = isValidUiSchema(uischema, schema);
  if (uiSchemaErrors && uiSchemaErrors !== '') {
    return <p>{uiSchemaErrors}</p>;
  }
  return <span />;
};

/**
 * Note: by returning a rank of 1000, we are saying that this renderer is very important,
 * one that must get used if there are any errors whatsoever.
 */
export const GoAErrorControlTester: RankedTester = rankWith(1000, (uischema, schema, context) => {
  const validJsonSchema = isValidJsonSchema(schema);
  const validUiSchema = isValidUiSchema(uischema, schema);
  return validUiSchema != null || validJsonSchema != null;
});

export default withJsonFormsControlProps(ErrorControl);
