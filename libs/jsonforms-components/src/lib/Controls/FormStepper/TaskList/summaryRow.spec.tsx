import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SummaryRow } from './summaryRow';

describe('SummaryRow Component', () => {
  const mockOnClick = jest.fn();

  afterEach(() => {
    mockOnClick.mockClear();
  });

  it('should render summary row', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <SummaryRow index={0} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('should call onClick when summary link is clicked', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <SummaryRow index={0} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const link = getByText('Summary');
    fireEvent.click(link);
    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  it('should prevent default on click', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <SummaryRow index={0} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const link = getByText('Summary');
    const event = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    fireEvent(link, event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should render with correct index', () => {
    const { getByTestId } = render(
      <table>
        <tbody>
          <SummaryRow index={5} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByTestId('page-ref-5')).toBeInTheDocument();
  });

  it('should render when isValid is true', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <SummaryRow index={0} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('should render when isValid is false', () => {
    const { getByText } = render(
      <table>
        <tbody>
          <SummaryRow index={0} isValid={false} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('should have correct testid format', () => {
    const { getByTestId } = render(
      <table>
        <tbody>
          <SummaryRow index={3} isValid={true} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByTestId('page-ref-3')).toBeInTheDocument();
  });
});
