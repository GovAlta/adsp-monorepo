/**
 * The error control is invoked whenever no other control can be found.  It is used to display
 * an error to the developers indicating that they have misconfigured one or more of their schemas and
 * that they need to take a close look.  It will attempt to provide information to guide the developer
 * toward fixing the error.
 */

import React from 'react';
import { ControlProps, JsonSchema, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { isNullSchema, isValidJsonObject } from '../errors/errorCheck';
import { getUISchemaErrors } from '../errors/schemaValidation';

export const errorComponent = (err: string): JSX.Element => {
  return <p>{err}</p>;
};

const isValidJsonSchema = (schema: JsonSchema): string | null => {
  if (isNullSchema(schema)) {
    return '';
  }
  if (!isValidJsonObject(schema)) {
    return 'Unable to render: json schema is not valid.';
  }
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
  const uiSchemaErrors = getUISchemaErrors(uischema, schema);
  if (uiSchemaErrors && uiSchemaErrors !== '') {
    return errorComponent(uiSchemaErrors);
  }
  return <span />;
};

/**
 * Note: by returning a rank of 1000, we are saying that this renderer is very important,
 * one that must get used if there are any errors whatsoever.
 */
export const GoAErrorControlTester: RankedTester = rankWith(1000, (uischema, schema, context) => {
  const validJsonSchema = isValidJsonSchema(schema);
  const validUiSchema = getUISchemaErrors(uischema, schema);
  return validUiSchema != null || validJsonSchema != null;
});

export default withJsonFormsControlProps(ErrorControl);
