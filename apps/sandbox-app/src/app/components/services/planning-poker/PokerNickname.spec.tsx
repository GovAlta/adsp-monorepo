import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerNickname } from './PokerNickname';

jest.mock('@abgov/react-components', () => ({
  GoabFormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabInput: ({
    name,
    value,
    testId,
    onChange,
  }: {
    name: string;
    value: string;
    testId: string;
    onChange: (detail: { name: string; value: string }) => void;
  }) => <input data-testid={testId} value={value} onChange={(e) => onChange({ name, value: e.target.value })} />,
  GoabButton: ({
    children,
    testId,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    testId: string;
    disabled: boolean;
    onClick: () => void;
  }) => (
    <button data-testid={testId} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

const renderNickname = (overrides = {}) => {
  const props = { nickname: '', defaultName: 'Subbu Mettu', saving: false, onSave: jest.fn(), ...overrides };
  const view = render(<PokerNickname {...props} />);
  return { props, ...view };
};

describe('PokerNickname', () => {
  test('shows the current nickname', () => {
    // Arrange & Act
    renderNickname({ nickname: 'Captain Estimate' });

    // Assert
    expect(screen.getByTestId('poker-nickname')).toHaveValue('Captain Estimate');
  });

  test('disables saving until the nickname changes', () => {
    // Arrange & Act
    renderNickname({ nickname: 'Captain Estimate' });

    // Assert
    expect(screen.getByTestId('poker-save-nickname')).toBeDisabled();
  });

  test('saves the new nickname without surrounding spaces', () => {
    // Arrange
    const { props } = renderNickname();
    fireEvent.change(screen.getByTestId('poker-nickname'), { target: { value: '  Captain Estimate ' } });

    // Act
    fireEvent.click(screen.getByTestId('poker-save-nickname'));

    // Assert
    expect(props.onSave).toHaveBeenCalledWith('Captain Estimate');
  });

  test('disables saving while a nickname is being saved', () => {
    // Arrange
    renderNickname({ saving: true });

    // Act
    fireEvent.change(screen.getByTestId('poker-nickname'), { target: { value: 'Captain Estimate' } });

    // Assert
    expect(screen.getByTestId('poker-save-nickname')).toBeDisabled();
  });

  test('updates the field when a saved nickname is restored', () => {
    // Arrange
    const { props, rerender } = renderNickname();

    // Act
    rerender(<PokerNickname {...props} nickname="Captain Estimate" />);

    // Assert
    expect(screen.getByTestId('poker-nickname')).toHaveValue('Captain Estimate');
  });
});
