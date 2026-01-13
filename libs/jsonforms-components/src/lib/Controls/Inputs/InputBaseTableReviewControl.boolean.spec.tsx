import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputBaseTableReview } from './InputBaseTableReviewControl';
import { ReviewContext } from '../../Context/ReviewContext';

describe('GoAInputBaseTableReview boolean rendering', () => {
  it('renders Yes/No when radio option true', () => {
    const props: Record<string, unknown> = {
      data: true,
      uischema: { scope: '#/properties/flag', options: { radio: true } },
      label: 'flag',
      schema: {},
      path: 'flag',
      errors: '',
      enabled: true,
      cells: [],
    };

    const { container } = render(
      <ReviewContext.Provider value={{ onEdit: undefined }}>
        <table>
          <tbody>
            <GoAInputBaseTableReview {...props} />
          </tbody>
        </table>
      </ReviewContext.Provider>
    );

    expect(container).toHaveTextContent('Yes');
  });

  it('renders Yes (label) when checkbox label present and label is empty', () => {
    const props: Record<string, unknown> = {
      data: true,
      uischema: { scope: '#/properties/flag', options: { text: 'My Checkbox', radio: false } },
      label: '',
      schema: {},
      path: 'flag',
      errors: '',
      enabled: true,
      cells: [],
    };

    const { container } = render(
      <ReviewContext.Provider value={{ onEdit: undefined }}>
        <table>
          <tbody>
            <GoAInputBaseTableReview {...props} />
          </tbody>
        </table>
      </ReviewContext.Provider>
    );

    expect(container).toHaveTextContent('Yes (My Checkbox)');
  });

  it('renders Change button when review context has onEdit', () => {
    const onEdit = jest.fn();
    const props: Record<string, unknown> = {
      data: 'value',
      uischema: { scope: '#/properties/field' },
      label: 'Field',
      schema: {},
      path: 'field',
      errors: '',
      enabled: true,
      cells: [],
    };

    render(
      <ReviewContext.Provider value={{ onEdit }}>
        <table>
          <tbody>
            <GoAInputBaseTableReview {...props} />
          </tbody>
        </table>
      </ReviewContext.Provider>
    );

    const btn = screen.getByText('Change');
    expect(btn).toBeTruthy();
  });
});
