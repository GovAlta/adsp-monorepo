import React from 'react';
import { render } from '@testing-library/react';
import { GoABaseInputReviewComponent } from './InputBaseReviewControl';
import { CellProps, StatePropsOfControl, UISchemaElement } from '@jsonforms/core';
import { text } from 'stream/consumers';

describe('GoABaseInputReviewComponent', () => {
  const baseProps: CellProps & StatePropsOfControl & { id: string } = {
    data: 'Review Text',
    id: 'input-id',
    isValid: true,
    required: true,
    rootSchema: {},
    uischema: {
      type: 'Control',
      scope: '',
      options: {
        radio: true,
        text: 'test',
      },
    },
    label: 'test label',
    errors: '',
    path: '',
    schema: {},
    visible: true,
    enabled: true,
    config: {},
    handleChange: jest.fn(),
  };

  it('renders the review text for non-boolean data', () => {
    const { getByTestId } = render(<GoABaseInputReviewComponent {...baseProps} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('Review Text');
  });

  it('renders "Yes" for radio boolean true data', () => {
    const props = {
      ...baseProps,
      data: true,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('Yes');
  });

  it('renders "No" for radio boolean false data', () => {
    const props = {
      ...baseProps,
      data: false,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('No');
  });

  it('renders "No" for checkbox boolean false data', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: {
          radio: false,
          text: 'test',
        },
      },
      data: false,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('No (test)');
  });

  it('renders "Yes" for checkbox boolean true data', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: {
          radio: false,
          text: 'test',
        },
      },
      data: true,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('Yes (test)');
  });

  it('renders "No" for checkbox boolean with data for required', () => {
    const props = {
      ...baseProps,
      schema: {
        type: 'boolean',
      },
      uischema: {
        ...baseProps.uischema,
        options: {
          radio: false,
          text: 'test',
        },
      },
      data: false,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('No (test) (required)');
  });

  it('renders an empty string for undefined data', () => {
    const props = {
      ...baseProps,
      data: undefined,
      label: 'test label',
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('');
  });

  it('renders an empty string for null data', () => {
    const props = {
      ...baseProps,
      data: null,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('');
  });
});
