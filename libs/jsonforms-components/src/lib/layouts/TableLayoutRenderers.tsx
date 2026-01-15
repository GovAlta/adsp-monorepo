
import React from 'react';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GroupLayout, Layout, LayoutProps, ControlProps } from '@jsonforms/core';
import { withJsonFormsLayoutProps, withJsonFormsControlProps } from '@jsonforms/react';
import { HelpContentComponent } from '../Additional/HelpContent';

export const TableLayoutRendererComponent = ({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
}: LayoutProps) => {
  const layout = uischema as Layout;

  return (
    <>
      {layout.elements.map((element, index) => {
        const stepId = uischema.options?.stepId;
        const childElement = stepId !== undefined ? { ...element, options: { ...element.options, stepId } } : element;
        return (
          <JsonFormsDispatch
            key={`${path}-${index}`}
            uischema={childElement}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        );
      })}
    </>
  );
};

export const TableGroupLayoutRendererComponent = ({
  uischema,
  schema,
  path,
  enabled,
  renderers,
  cells,
}: LayoutProps) => {
  const group = uischema as GroupLayout;

  return (
    <>
      {group.label && (
        <tr>
          <td colSpan={3}>
            <h3>{group.label}</h3>
          </td>
        </tr>
      )}
      {group.elements.map((element, index) => {
        const stepId = uischema.options?.stepId;
        const childElement = stepId !== undefined ? { ...element, options: { ...element.options, stepId } } : element;

        return (
          <JsonFormsDispatch
            key={`${path}-${index}`}
            uischema={childElement}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        );
      })}
    </>
  );
};

export const TableHelpContentComponent = (props: ControlProps) => {
  return (
    <tr>
      <td colSpan={3}>
        <HelpContentComponent {...props} />
      </td>
    </tr>
  );
};

export const TableLayoutRenderer = withJsonFormsLayoutProps(TableLayoutRendererComponent);
export const TableGroupLayoutRenderer = withJsonFormsLayoutProps(TableGroupLayoutRendererComponent);
export const TableHelpContentRenderer = withJsonFormsControlProps(TableHelpContentComponent);
