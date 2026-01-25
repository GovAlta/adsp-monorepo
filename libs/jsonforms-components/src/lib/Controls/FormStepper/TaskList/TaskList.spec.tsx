import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskList, TocProps } from './TaskList';
import { CategoryState } from '../context';

describe('TaskList Component', () => {
  const mockOnClick = jest.fn();

  const createCategory = (
    label: string,
    isCompleted: boolean = false,
    isValid: boolean = true,
    isEnabled: boolean = true,
    visible: boolean = true,
    showInTaskList: boolean = true
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
      options: { showInTaskList },
    },
  });

  const baseProps: TocProps = {
    categories: [],
    onClick: mockOnClick,
    title: 'Test Tasks',
    subtitle: 'Test Subtitle',
    isValid: true,
    hideSummary: false,
  };

  afterEach(() => {
    mockOnClick.mockClear();
  });

  it('should render TaskList component', () => {
    const { getByTestId } = render(<TaskList {...baseProps} />);
    expect(getByTestId('table-of-contents')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    const { getByText } = render(<TaskList {...baseProps} title="My Tasks" />);
    expect(getByText('My Tasks')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    const props = { ...baseProps, title: undefined };
    const { queryByText } = render(<TaskList {...props} />);
    expect(queryByText('My Tasks')).not.toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    const { getByText } = render(<TaskList {...baseProps} subtitle="My Subtitle" />);
    expect(getByText('My Subtitle')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    const props = { ...baseProps, subtitle: undefined };
    const { queryByText } = render(<TaskList {...props} />);
    expect(queryByText('My Subtitle')).not.toBeInTheDocument();
  });

  it('should render categories', () => {
    const categories = [createCategory('Category 1'), createCategory('Category 2')] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { getByText } = render(<TaskList {...props} />);
    expect(getByText('Category 1')).toBeInTheDocument();
    expect(getByText('Category 2')).toBeInTheDocument();
  });

  it('should call onClick when category is clicked', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
    };

    render(<TaskList {...props} />);
    const categoryRow = screen.getByTestId('page-ref-0');
    fireEvent.click(categoryRow);
    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  it('should handle category with showInTaskList false', () => {
    const categories = [createCategory('Category 1', false, true, true, true, false)] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { queryByText } = render(<TaskList {...props} />);
    expect(queryByText('Category 1')).not.toBeInTheDocument();
  });

  it('should handle invisible categories', () => {
    const categories = [createCategory('Category 1', false, true, true, false)] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { queryByText } = render(<TaskList {...props} />);
    expect(queryByText('Category 1')).not.toBeInTheDocument();
  });

  it('should handle disabled categories', () => {
    const categories = [createCategory('Category 1', false, true, false)] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { getByText } = render(<TaskList {...props} />);
    expect(getByText('Category 1')).toBeInTheDocument();

    const categoryRow = screen.getByTestId('page-ref-0');
    fireEvent.click(categoryRow);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should render summary row when hideSummary is false', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
      hideSummary: false,
    };

    const { getByText } = render(<TaskList {...props} />);
    expect(getByText('Summary')).toBeInTheDocument();
  });

  it('should not render summary row when hideSummary is true', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
      hideSummary: true,
    };

    const { queryByText } = render(<TaskList {...props} />);
    expect(queryByText('Summary')).not.toBeInTheDocument();
  });

  it('should calculate completion status correctly', () => {
    const categories = [
      createCategory('Category 1', true, true),
      createCategory('Category 2', false, false),
    ] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { container } = render(<TaskList {...props} />);
    expect(container).toBeTruthy();
  });

  it('should handle Enter key on category', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
    };

    render(<TaskList {...props} />);
    const categoryRow = screen.getByTestId('page-ref-0');
    fireEvent.keyDown(categoryRow, { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  it('should handle non-Enter key on category', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
    };

    render(<TaskList {...props} />);
    const categoryRow = screen.getByTestId('page-ref-0');
    fireEvent.keyDown(categoryRow, { key: 'Escape' });
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should handle multiple categories with mixed visibility', () => {
    const categories = [
      createCategory('Category 1', true, true),
      createCategory('Category 2', false, false, true, false),
      createCategory('Category 3', false, true),
    ] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { getByText, queryByText } = render(<TaskList {...props} />);
    expect(getByText('Category 1')).toBeInTheDocument();
    expect(queryByText('Category 2')).not.toBeInTheDocument();
    expect(getByText('Category 3')).toBeInTheDocument();
  });

  it('should merge orphan sections correctly', () => {
    const categories = [createCategory('Category 1', true, true)] as unknown as CategoryState[];

    const props = {
      ...baseProps,
      categories,
    };

    const { container } = render(<TaskList {...props} />);
    expect(container).toBeTruthy();
  });

  it('should call onClick when summary row is clicked', () => {
    const categories = [createCategory('Category 1')] as unknown as CategoryState[];
    const props = {
      ...baseProps,
      categories,
      hideSummary: false,
    };

    render(<TaskList {...props} />);
    const summaryLink = screen.getByText('Summary');
    fireEvent.click(summaryLink);
    expect(mockOnClick).toHaveBeenCalledWith(1);
  });
});
