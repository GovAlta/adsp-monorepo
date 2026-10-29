import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Ajv from 'ajv';
import { Categorization } from '@jsonforms/core';
import { FormStepperReviewer } from './FormStepperReviewControl';
import { CategorizationStepperLayoutReviewRendererProps } from './types';

const createProps = (uischema: Categorization): CategorizationStepperLayoutReviewRendererProps => ({
  uischema,
  schema: { type: 'object', properties: {} },
  enabled: true,
  label: 'Review',
  config: {},
  path: '',
  data: {},
  visible: true,
  ajv: new Ajv({ allErrors: true }),
  locale: 'en',
  t: jest.fn(),
  direction: 'column',
});

const createCategorization = (options: Categorization['options'] = {}): Categorization => ({
  type: 'Categorization',
  elements: [],
  options,
});

describe('FormStepperReviewer', () => {
  it('displays the configured summary page title', () => {
    // Arrange
    const props = createProps(createCategorization({ summaryPageTitle: 'Review your application' }));

    // Act
    render(<FormStepperReviewer {...props} />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Review your application' })).toBeInTheDocument();
  });

  it('does not display a summary page title when none is configured', () => {
    // Arrange
    const props = createProps(createCategorization());

    // Act
    render(<FormStepperReviewer {...props} />);

    // Assert
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('does not display a summary page title when the form is read only', () => {
    // Arrange
    const props = createProps(
      createCategorization({
        summaryPageTitle: 'Review your application',
        componentProps: { readOnly: true },
      }),
    );

    // Act
    render(<FormStepperReviewer {...props} />);

    // Assert
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
