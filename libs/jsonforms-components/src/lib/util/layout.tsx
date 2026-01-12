import React, { ComponentType } from 'react';
import { useJsonForms } from '@jsonforms/react';
import isEmpty from 'lodash/isEmpty';
import styled from 'styled-components';
import type { UISchemaElement } from '@jsonforms/core';
import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  OwnPropsOfRenderer,
  getAjv,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoabGrid } from '@abgov/react-components';
import { Visible } from './style-component';
import Ajv from 'ajv';
export type Ajv8 = Ajv;
export const renderLayoutElements = (
  elements: UISchemaElement[],
  schema?: JsonSchema,
  path?: string,
  enabled?: boolean,
  renderers?: JsonFormsRendererRegistryEntry[],
  cells?: JsonFormsCellRendererRegistryEntry[]
) => {
  return elements.map((child, index) => (
    <JsonFormsDispatch
      uischema={child}
      schema={schema}
      key={`review-${path}_${index}`}
      path={path}
      enabled={enabled}
      renderers={renderers}
      cells={cells}
    />
  ));
};

export interface LayoutRendererProps extends OwnPropsOfRenderer {
  elements: UISchemaElement[];
  direction: 'row' | 'column';
  width?: string;
  option: {
    space?: string;
  };
}
export interface AjvProps {
  ajv: Ajv;
}

export const withAjvProps = <P extends object>(Component: ComponentType<AjvProps & P>) =>
  function WithAjvProps(props: P) {
    const ctx = useJsonForms();
    const ajv = getAjv({ jsonforms: { ...ctx } });

    return <Component {...props} ajv={ajv} />;
  };

export const LayoutRenderer = ({
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
  visible,
  width,
}: LayoutRendererProps) => {
  if (isEmpty(elements)) {
    return null;
  } else {
    if (direction === 'row') {
      return (
        <Visible visible={visible}>
          <GoabGrid minChildWidth={width || '10ch'}>
            {renderLayoutElements(elements, schema, path, enabled, renderers, cells)}
          </GoabGrid>
        </Visible>
      );
    } else {
      return (
        <Visible visible={visible}>{renderLayoutElements(elements, schema, path, enabled, renderers, cells)}</Visible>
      );
    }
  }
};
export const ReviewLayoutRenderer = ({
  elements,
  schema,
  path,
  enabled,
  direction,
  renderers,
  cells,
  visible,
  width,
}: LayoutRendererProps) => {
  if (isEmpty(elements)) {
    return null;
  } else {
    if (direction === 'row') {
      return (
        <Visible visible={visible}>
          <ReviewGrid>{renderLayoutElements(elements, schema, path, enabled, renderers, cells)}</ReviewGrid>
        </Visible>
      );
    } else {
      return (
        <Visible visible={visible}>{renderLayoutElements(elements, schema, path, enabled, renderers, cells)}</Visible>
      );
    }
  }
};

export const ReviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, calc(50% - 8px)));
  gap: 16px;
`;
