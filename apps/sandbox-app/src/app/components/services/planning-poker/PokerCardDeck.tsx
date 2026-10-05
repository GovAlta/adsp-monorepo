import React from 'react';
import styled from 'styled-components';
import { POKER_DECK } from '../../../state';
import { formatCard } from './pokerUtils';

interface PokerCardDeckProps {
  selected: string | null;
  disabled: boolean;
  onSelect: (card: string) => void;
}

export const PokerCardDeck = ({ selected, disabled, onSelect }: PokerCardDeckProps) => {
  return (
    <Deck role="group" aria-label="Estimate cards">
      {POKER_DECK.map((card) => (
        <Card
          key={card}
          type="button"
          aria-pressed={selected === card}
          aria-label={card === 'coffee' ? 'Coffee break' : `${card} points`}
          data-testid={`poker-card-${card}`}
          disabled={disabled}
          onClick={() => onSelect(card)}
        >
          {formatCard(card)}
        </Card>
      ))}
    </Deck>
  );
};

const Deck = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-s);
  margin: var(--goa-space-m) 0;
`;

const Card = styled.button`
  width: 64px;
  height: 96px;
  border: 2px solid var(--goa-color-interactive-default);
  border-radius: var(--goa-border-radius-m);
  background: var(--goa-color-greyscale-white);
  color: var(--goa-color-interactive-default);
  font: var(--goa-typography-heading-m);
  cursor: pointer;
  transition: transform 0.1s ease-in-out;

  &:hover:not(:disabled) {
    transform: translateY(-4px);
  }

  &[aria-pressed='true'] {
    background: var(--goa-color-interactive-default);
    color: var(--goa-color-greyscale-white);
    transform: translateY(-4px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 3px solid var(--goa-color-interactive-focus);
    outline-offset: 2px;
  }
`;
