import React, { useMemo } from 'react';

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
  const memoizedSchema = useMemo(() => ({ ...props.schema }), [props.schema]);

  return (
    <Visible visible={props.visible} data-testid={`${props.path}-categories-${props.categoryIndex}`}>
      {props.category.elements.map((uiSchema, index) => {
        return (
          <JsonFormsDispatch
            key={`${props.path}-category-page-${index}`}
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
