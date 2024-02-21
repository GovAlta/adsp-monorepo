import isEmpty from 'lodash/isEmpty';
import React from 'react';

import type { UISchemaElement } from '@jsonforms/core';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoAGrid } from '@abgov/react-components-new';
import { Hidden } from '@mui/material';

export const renderLayoutElements = (
  elements: UISchemaElement[],
  schema: JsonSchema,
  path: string,
  enabled: boolean,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  return elements.map((child, index) => (
    <div key={index}>
      <JsonFormsDispatch
        uischema={child}
        schema={schema}
        key={path}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
    </div>
  ));
};

export interface LayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
}

export const LayoutRenderer = ({
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
  visible,
}: LayoutRendererProps) => {
  if (isEmpty(elements)) {
    return null;
  } else {
    if (direction === 'row') {
      return (
        <Hidden xsUp={!visible}>
          <GoAGrid minChildWidth="10ch">
            {renderLayoutElements(elements, schema, path, enabled, renderers, cells)}
          </GoAGrid>
        </Hidden>
      );
    } else {
      return <Hidden xsUp={!visible}>{renderLayoutElements(elements, schema, path, enabled, renderers, cells)}</Hidden>;
    }
  }
};
