import React, { Component, CSSProperties } from 'react';
import styled from 'styled-components';

export interface ContextMenuItem {
  icon: string | JSX.Element;
  text?: string;
  name: string;
  title?: string;
}

interface Props {
  onAction: (name: string) => void;
  items: ContextMenuItem[];
}

function ContextMenu({ onAction, items }: Props): JSX.Element {
  return (
    <Root>
      <Menu>
        {items.map((item) => (
          <div
            data-testid={`context-menu--${item.name}`}
            key={item.name}
            onClick={() => onAction(item.name)}
            title={item.title}
          >
            {typeof item.icon === 'string' ? <img src={item.icon} alt={item.name} /> : <Component {...item.icon} />}
          </div>
        ))}
      </Menu>
    </Root>
  );
}

export default ContextMenu;

const Menu = styled.div`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #fff;

  > div {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 0.25rem;
    padding: 0.25rem;
    border: 1px solid transparent;

    &:hover {
      border: 1px solid var(--color-gray-400);
    }
  }
  > div + div {
    margin-left: 0.5rem;
  }
`;

const Root = styled.div`
  img {
    width: 1.25rem;
    height: auto;
  }
`;
