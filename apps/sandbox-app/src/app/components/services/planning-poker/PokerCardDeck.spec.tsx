import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PokerCardDeck } from './PokerCardDeck';

describe('PokerCardDeck', () => {
  test('shows every card in the deck', () => {
    // Arrange & Act
    render(<PokerCardDeck selected={null} disabled={false} onSelect={jest.fn()} />);

    // Assert
    expect(screen.getAllByRole('button')).toHaveLength(10);
  });

  test('reports the card that was picked', () => {
    // Arrange
    const onSelect = jest.fn();
    render(<PokerCardDeck selected={null} disabled={false} onSelect={onSelect} />);

    // Act
    fireEvent.click(screen.getByTestId('poker-card-8'));

    // Assert
    expect(onSelect).toHaveBeenCalledWith('8');
  });

  test('marks the selected card as pressed', () => {
    // Arrange & Act
    render(<PokerCardDeck selected="5" disabled={false} onSelect={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('poker-card-5')).toHaveAttribute('aria-pressed', 'true');
  });

  test('disables the cards when the round is not open', () => {
    // Arrange & Act
    render(<PokerCardDeck selected={null} disabled={true} onSelect={jest.fn()} />);

    // Assert
    expect(screen.getByTestId('poker-card-coffee')).toBeDisabled();
  });
});
