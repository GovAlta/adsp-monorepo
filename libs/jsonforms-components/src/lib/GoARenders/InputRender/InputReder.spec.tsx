import { render } from '@testing-library/react';
import { GoARenderers } from '../index';
import { JsonForms } from '@jsonforms/react';
import { person } from '@jsonforms/examples';
import { vanillaCells } from '@jsonforms/vanilla-renderers';

describe('Test the GoA Renders', () => {
  const schema = person.schema;
  const initialData = person.data;
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/name',
            options: {
              GoAInput: {
                name: 'Name',
                type: 'text',
              },
            },
          },
        ],
      },
    ],
  };
  it('Can create the GoA Input render with minimum input', () => {
    const wrapperTestId = 'GoAInput-render-wrapper';
    const { queryByTestId } = render(
      <div data-testid={`${wrapperTestId}`}>
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={initialData}
          renderers={GoARenderers}
          cells={vanillaCells}
          // eslint-disable-next-line
          onChange={() => {}}
        />
      </div>
    );
    expect(queryByTestId(wrapperTestId)).toBeTruthy();
  });

  it('Can create the GoA Input render with test id', () => {
    const wrapperTestId = 'GoAInput-render-wrapper';
    const newUISchema = { ...uischema };
    const GoAInputTestId = 'goa-test-input';
    newUISchema.elements[0].options = {
      GoAInput: {
        name: 'goa-input-name',
        type: 'text',
        testId: GoAInputTestId,
      },
    };
    const { queryByTestId } = render(
      <div data-testid={`${wrapperTestId}`}>
        <JsonForms
          schema={schema}
          uischema={newUISchema}
          data={initialData}
          renderers={GoARenderers}
          cells={vanillaCells}
          // eslint-disable-next-line
          onChange={() => {}}
        />
      </div>
    );
    const GoAInput = queryByTestId(GoAInputTestId);
    expect(GoAInput).toBeTruthy();
  });

  it('Will not be picked up if GoAInput does not exist', () => {
    const newUISchema = { ...uischema };
    const GoAInputTestId = 'goa-test-input';

    newUISchema.elements[0].options = {
      GoAInputAWrong: {
        name: 'Name',
        type: 'text',
        testId: GoAInputTestId,
      },
    };

    const { queryByTestId } = render(
      <div>
        <JsonForms
          schema={schema}
          uischema={newUISchema}
          data={initialData}
          renderers={GoARenderers}
          cells={vanillaCells}
          // eslint-disable-next-line
          onChange={() => {}}
        />
      </div>
    );

    const GoAInput = queryByTestId(GoAInputTestId);
    expect(GoAInput).toBe(null);
  });
});
