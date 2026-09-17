import React from 'react';

import { JsonFormsCellRendererRegistryEntry, JsonFormsRendererRegistryEntry, JsonSchema } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Visible } from '../../util';
import { CategorizationElement } from './context/types';

export interface StepProps {
  category: CategorizationElement;
  categoryIndex: number;
  schema: JsonSchema;
  visible: boolean;
  enabled: boolean;
  path: string;
  renderers: JsonFormsRendererRegistryEntry[] | undefined;
  cells: JsonFormsCellRendererRegistryEntry[] | undefined;
  data: Record<string, unknown>;
  validationTrigger?: number;
}
export const RenderStepElements = (props: StepProps): JSX.Element => {
  // Passing the schema straight through matters for performance. This used to hand down a shallow
  // copy, and because the copy is made in a hook it is a brand new object every time the step
  // changes — which invalidates every identity-keyed cache downstream, including the renderer
  // lookup JsonForms memoizes on the schema it is given.
  const memoizedSchema = props.schema;

  return (
    <Visible
      $visible={props.visible}
      data-testid={`${props?.path || props.category?.label}-categories-${props.categoryIndex}`}
    >
      {props.category.elements.map((uiSchema, index) => {
        return (
          <JsonFormsDispatch
            key={`${props?.path || props.category?.label}-category-page-${index}`}
            schema={memoizedSchema}
            uischema={uiSchema}
            renderers={props.renderers}
            cells={props.cells}
            path={props.path}
            visible={props.visible}
            enabled={props.enabled}
          />
        );
      })}
    </Visible>
  );
};
