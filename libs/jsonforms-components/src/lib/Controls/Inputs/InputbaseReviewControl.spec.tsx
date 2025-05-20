import React from 'react';
import { render } from '@testing-library/react';
import { GoABaseInputReviewComponent } from './InputBaseReviewControl';
import { CellProps, StatePropsOfControl } from '@jsonforms/core';
import { GoAInputBaseTableReview } from './InputBaseTableReviewControl';

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
    expect(reviewControl.textContent).toBe('No (test)');
  });

  it('renders "No" for checkbox boolean false data', () => {
    const props = {
      ...baseProps,
      label: '',
      uischema: {
        ...baseProps.uischema,
        options: {
          radio: true,
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
      label: '',
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

  it('renders "No" for checkbox boolean with false data for required', () => {
    const props = {
      ...baseProps,
      label: '',
      required: true,
      schema: {
        type: 'boolean',
        anyOf: [
          {
            enum: [true],
          },
        ],
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
    console.log('reviewControl.textContent', reviewControl.textContent);
    expect(reviewControl.textContent).toContain('No (test) (required)');
    expect(reviewControl.textContent).toContain('test is required');
  });

  it('renders an empty string for undefined data', () => {
    const props = {
      ...baseProps,
      schema: {},
      data: undefined,
      label: 'test label',
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('No (test)');
  });

  it('renders checkbox label with scope without options text property', () => {
    const props = {
      ...baseProps,
      label: '',
      uischema: {
        ...baseProps.uischema,
        scope: '#/properties/ideclare',
        options: {
          radio: false,
        },
      },
      data: true,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('Yes (Ideclare)');
  });

  it('renders checkbox label with Yes label', () => {
    const props = {
      ...baseProps,
      label: 'test',
      uischema: {
        ...baseProps.uischema,
        scope: '#/properties/ideclare',
        options: {
          radio: false,
        },
      },
      data: true,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('Yes (Ideclare)');
  });

  it('renders checkbox label with No label', () => {
    const props = {
      ...baseProps,
      label: 'test',
      uischema: {
        ...baseProps.uischema,
        scope: '#/properties/ideclare',
        options: {
          radio: false,
        },
      },
      data: false,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('No (Ideclare)');
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

  it('renders an empty string for null data with skip initial validation', () => {
    const props = {
      ...baseProps,
      data: null,
      skipInitialValidation: true,
    };
    const { getByTestId } = render(<GoABaseInputReviewComponent {...props} />);
    const reviewControl = getByTestId('review-control-input-id');
    expect(reviewControl.textContent).toBe('');
  });
});

describe('Can render GoAInputBaseTableReview', () => {
  const baseTableReviewProps = {
    id: 'mock-id-input',
    label: 'mock',
    uischema: {
      type: 'Control',
      scope: '#/properties/mock',
    },
    data: 'mock-data',
    schema: {},
    errors: '',
    rootSchema: {},
    path: '',
    visible: true,
    enabled: true,
    config: {},
    handleChange: jest.fn(),
  };
  it('can render the GoAInputBaseTableReview', () => {
    const { getByTestId } = render(<GoAInputBaseTableReview {...baseTableReviewProps} />);
    const tableReviewRow = getByTestId('input-base-table-mock-row');
    expect(tableReviewRow).toBeTruthy();
    expect(tableReviewRow?.textContent).toContain('mock-data');
  });

  it('can render the GoAInputBaseTableReview with boolean value', () => {
    const { getByTestId } = render(<GoAInputBaseTableReview {...{ ...baseTableReviewProps, data: true }} />);
    const tableReviewRow = getByTestId('input-base-table-mock-row');
    expect(tableReviewRow?.textContent).toContain('Yes');
  });
});
