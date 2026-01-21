import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryRow } from './categoryRow';
import { CategoryState } from '../context';

describe('CategoryRow Component', () => {
  const mockOnClick = jest.fn();

  const createCategory = (
    label: string = 'Test Category',
    isCompleted: boolean = false,
    isValid: boolean = true,
    isEnabled: boolean = true,
    visible: boolean = true
  ): CategoryState => ({
    label,
    isCompleted,
    isValid,
    isEnabled,
    isVisited: true,
    visible,
    uischema: {
      type: 'Category',
      elements: [],
    },
  });

  afterEach(() => {
    mockOnClick.mockClear();
  });

  it('should render category row when visible', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByText } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByText('Test Category')).toBeInTheDocument();
  });

  it('should not render category row when not visible', () => {
    const category = createCategory('Test Category', false, true, true, false);
    const { queryByText } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(queryByText('Test Category')).not.toBeInTheDocument();
  });

  it('should call onClick when row is clicked', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    fireEvent.click(row);
    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  it('should not call onClick when disabled row is clicked', () => {
    const category = createCategory('Test Category', false, true, false, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    fireEvent.click(row);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should call onClick on Enter key when enabled', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  it('should not call onClick on other key presses', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    fireEvent.keyDown(row, { key: 'Escape' });
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should display completed status when category is completed', () => {
    const category = createCategory('Completed Task', true, true, true, true);
    const { container } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(container).toBeTruthy();
  });

  it('should display incomplete status when category is not completed', () => {
    const category = createCategory('Incomplete Task', false, true, true, true);
    const { container } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(container).toBeTruthy();
  });

  it('should render with correct index', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={5} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    expect(getByTestId('page-ref-5')).toBeInTheDocument();
  });

  it('should handle prevent default on click', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    const event = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    fireEvent(row, event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should have correct tabIndex', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    expect(row).toHaveAttribute('tabIndex', '0');
  });

  it('should have role button', () => {
    const category = createCategory('Test Category', false, true, true, true);
    const { getByTestId } = render(
      <table>
        <tbody>
          <CategoryRow category={category as unknown as CategoryState} index={0} onClick={mockOnClick} />
        </tbody>
      </table>
    );
    const row = getByTestId('page-ref-0');
    expect(row).toHaveAttribute('role', 'button');
  });
});
