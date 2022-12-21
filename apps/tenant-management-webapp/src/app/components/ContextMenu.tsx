import React, { FC } from 'react';
import { GoAIconButton, GoAIconType } from '@abgov/react-components-new';
import styled from 'styled-components';

interface ContextMenuIconProps {
  type: GoAIconType;
  testId?: string;
  title?: string;
  onClick?: () => void;
}

export const GoAContextMenuIcon: FC<ContextMenuIconProps> = (props) => {
  return (
    <GoAIconButton
      icon={props.type}
      onClick={props.onClick}
      title={props.title}
      date-testId={props.testId}
      size="small"
    />
  );
};

export const GoAContextMenu = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  gap: 0.25rem;

  > .goa-icon-button {
    cursor: pointer;
    border-radius: 0.25rem;
    padding: 0.25rem;
  }
  > .goa-icon-button + .goa-icon-button {
    margin-left: 0rem;
  }
`;
