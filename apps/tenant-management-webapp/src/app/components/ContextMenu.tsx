import React, { Component, ReactElement } from 'react';
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
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #fff;
  box-shadow: 0 0 8px -2px rgba(0, 0, 0, 0.1);

  > div {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 0.25rem;
    padding: 0.25rem;

    &:hover {
      background: var(--color-gray-200);
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
