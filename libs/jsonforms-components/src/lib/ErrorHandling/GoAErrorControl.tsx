/**
 * The error control is invoked whenever no other control can be found.  It is used to display
 * an error to the developers indicating that they have misconfigured one or more of their schemas and
 * that they need to take a close look.  It will attempt to provide information to guide the developer
 * toward fixing the error.
 */

import React from 'react';
import { ControlProps, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { getUISchemaErrors } from './schemaValidation';
import { callout } from '../Additional/GoACalloutControl';

// Some 'errors' need not be reported, but we want to handle them
// here.  e.g.  A layout with empty elements should be quietly ignored.
// this is handled by the errors !== '' check.
const ErrorControl = (props: ControlProps): JSX.Element => {
  const { schema, uischema } = props;
  const uiSchemaErrors = getUISchemaErrors(uischema, schema);
  if (uiSchemaErrors && uiSchemaErrors !== '') {
    return callout({ message: uiSchemaErrors });
  }
  return <span />;
};

/**
 * Note: by returning a rank of 1000, we are saying that this renderer is very important,
 * one that must get used if there are any errors whatsoever.
 */
export const GoAErrorControlTester: RankedTester = rankWith(1000, (uischema, schema, context) => {
  const validUiSchema = getUISchemaErrors(uischema, schema);
  return validUiSchema != null;
});

export default withJsonFormsControlProps(ErrorControl);
