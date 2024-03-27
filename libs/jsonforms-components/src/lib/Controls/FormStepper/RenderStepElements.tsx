import {
  Categorization,
  Category,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Hidden } from '@mui/material';

export type CategorizationElement = Category | Categorization;

export interface StepProps {
  category: CategorizationElement;
  categoryIndex: number;
  step: number;
  schema: JsonSchema;
  enabled: boolean;
  visible: boolean;
  path: string;
  disabledCategoryMap: boolean[];
  renderers: JsonFormsRendererRegistryEntry[] | undefined;
  cells: JsonFormsCellRendererRegistryEntry[] | undefined;
}

export const RenderStepElements = (props: StepProps): JSX.Element => {
  return (
    /*
      [Mar-04-2024][Paul Li] the GoAPages internal state cannot handle the hidden/display well. We need extra hide/display control to it appropriately.
     */
    <Hidden xsUp={props.categoryIndex !== props.step - 1}>
      {props.category.elements.map((uiSchema, index) => {
        return (
          <JsonFormsDispatch
            key={index}
            schema={props.schema}
            uischema={uiSchema}
            renderers={props.renderers}
            cells={props.cells}
            path={props.path}
            visible={props.visible}
            enabled={props.enabled && !props.disabledCategoryMap[props.categoryIndex]}
          />
        );
      })}
    </Hidden>
  );
};
