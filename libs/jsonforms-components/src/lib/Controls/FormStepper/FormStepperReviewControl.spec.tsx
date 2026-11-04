import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Ajv from 'ajv';
import { Categorization, Category, ControlElement } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';
import { FormStepperReviewer } from './FormStepperReviewControl';
import { CategorizationStepperLayoutReviewRendererProps } from './types';

jest.mock('@jsonforms/react', () => ({
  ...jest.requireActual('@jsonforms/react'),
  JsonFormsDispatch: () => null,
}));

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

const createCategory = (label: string, options: Category['options'] = {}): Category => ({
  type: 'Category',
  label,
  options,
  elements: [{ type: 'Control', scope: '#/properties/firstName' } as ControlElement],
});

const createCategorizationWith = (categories: Category[]): Categorization => ({
  type: 'Categorization',
  elements: categories,
  options: {},
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
    const props = createProps(createCategorization({ summaryPageTitle: 'Review your application' }));

    // Act
    render(
      <JsonFormsContext.Provider value={{ readonly: true, dispatch: jest.fn() }}>
        <FormStepperReviewer {...props} />
      </JsonFormsContext.Provider>,
    );

    // Assert
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  describe('category visibility', () => {
    it('displays a category shown in the task list', () => {
      // Arrange
      const props = createProps(createCategorizationWith([createCategory('Applicant', { showInTaskList: true })]));

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getByText('Applicant')).toBeInTheDocument();
    });

    it('does not display a category hidden from the task list', () => {
      // Arrange
      const props = createProps(createCategorizationWith([createCategory('Applicant', { showInTaskList: false })]));

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByText('Applicant')).not.toBeInTheDocument();
    });

    it('does not display a category when showInTaskList is not configured', () => {
      // Arrange
      const props = createProps(createCategorizationWith([createCategory('Applicant', {})]));

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByText('Applicant')).not.toBeInTheDocument();
    });

    it('displays only the categories shown in the task list', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true }),
          createCategory('Internal review', { showInTaskList: false }),
          createCategory('Employer', {}),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getAllByText(/Applicant|Internal review|Employer/)).toHaveLength(1);
    });

    it('does not display a category with no visible content', () => {
      // Arrange
      const emptyCategory: Category = {
        type: 'Category',
        label: 'Applicant',
        options: { showInTaskList: true },
        elements: [],
      };
      const props = createProps(createCategorizationWith([emptyCategory]));

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByText('Applicant')).not.toBeInTheDocument();
    });
  });

  describe('section titles', () => {
    it('displays the section title before a category shown in the task list', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true, sectionTitle: 'Personal information' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getByRole('heading', { name: 'Personal information' })).toBeInTheDocument();
    });

    it('displays a shared section title only once for consecutive categories', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true, sectionTitle: 'Personal information' }),
          createCategory('Spouse', { showInTaskList: true, sectionTitle: 'Personal information' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getAllByRole('heading', { name: 'Personal information' })).toHaveLength(1);
    });

    it('displays each distinct section title', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true, sectionTitle: 'Personal information' }),
          createCategory('Employer', { showInTaskList: true, sectionTitle: 'Employment' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getByRole('heading', { name: 'Employment' })).toBeInTheDocument();
    });

    it('places the section title before its first category', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true, sectionTitle: 'Personal information' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      const title = screen.getByTestId('jsonforms-table-review-section-title-0');
      const section = document.getElementById('jsonforms-table-review-section-0');
      expect(title.compareDocumentPosition(section as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('does not display the section title when the category is not shown in the task list', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: false, sectionTitle: 'Personal information' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByRole('heading', { name: 'Personal information' })).not.toBeInTheDocument();
    });

    it.each([
      ['empty', ''],
      ['whitespace only', '   '],
    ])('does not display a section title that is %s', (_description, sectionTitle) => {
      // Arrange
      const props = createProps(
        createCategorizationWith([createCategory('Applicant', { showInTaskList: true, sectionTitle })]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByTestId('jsonforms-table-review-section-title-0')).not.toBeInTheDocument();
    });

    it('does not display a section title for a category with no visible content', () => {
      // Arrange
      const emptyCategory: Category = {
        type: 'Category',
        label: 'Applicant',
        options: { showInTaskList: true, sectionTitle: 'Personal information' },
        elements: [],
      };
      const props = createProps(createCategorizationWith([emptyCategory]));

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.queryByRole('heading', { name: 'Personal information' })).not.toBeInTheDocument();
    });

    it('displays the section title again after a category from a different section', () => {
      // Arrange
      const props = createProps(
        createCategorizationWith([
          createCategory('Applicant', { showInTaskList: true, sectionTitle: 'Personal information' }),
          createCategory('Employer', { showInTaskList: true, sectionTitle: 'Employment' }),
          createCategory('Spouse', { showInTaskList: true, sectionTitle: 'Personal information' }),
        ]),
      );

      // Act
      render(<FormStepperReviewer {...props} />);

      // Assert
      expect(screen.getAllByRole('heading', { name: 'Personal information' })).toHaveLength(2);
    });
  });
});
