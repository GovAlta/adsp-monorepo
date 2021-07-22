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
  border?: boolean;
}

function ContextMenu({ onAction, items, ...props }: Props): JSX.Element {
  const borderStyles: CSSProperties = {
    boxShadow: '0 0 8px -2px rgba(0, 0, 0, 0.1)',
    border: '1px solid #ccc',
    borderRadius: '0.25rem',
  };

  return (
    <Root>
      <Menu style={props.border ? borderStyles : {}} className={props.border ? 'menu-border' : ''}>
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
