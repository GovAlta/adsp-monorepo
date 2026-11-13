import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonForms } from '@jsonforms/react';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { GoAReviewRenderers } from './index';

describe('GoAReviewRenderers', () => {
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      contactInformation: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          phone: { type: 'string' },
          preferredContactMethod: { type: 'string' },
        },
      },
    },
  };

  const uischema = {
    type: 'VerticalLayout',
    elements: [{ type: 'Control', scope: '#/properties/contactInformation' }],
  } as UISchemaElement;

  it('renders contact information in a non-stepper review', () => {
    render(
      <table>
        <tbody>
          <JsonForms
            schema={schema}
            uischema={uischema}
            data={{
              contactInformation: { email: 'john@example.com', phone: '780-555-1234', preferredContactMethod: 'Phone' },
            }}
            renderers={GoAReviewRenderers}
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByText(/No applicable renderer found/i)).not.toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('780-555-1234')).toBeInTheDocument();
  });
});
