import React, { FC } from 'react';
import { GoabIconButton } from '@abgov/react-components-ds1';
import { GoabIconType } from '@abgov/ui-components-common';
import styled from 'styled-components';

interface ContextMenuIconProps {
  type: GoabIconType;
  testId?: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const GoAContextMenuIcon: FC<ContextMenuIconProps> = (props) => {
  return (
    <GoabIconButton
      icon={props.type}
      onClick={props.onClick}
      title={props.title}
      testId={props.testId}
      size="small"
      disabled={props.disabled}
    />
  );
};

export const GoAContextMenu = styled.div`
  display: flex;
  align-items: center;
  background-color: #fff;
  gap: var(--goa-space-2xs);

  > .goa-icon-button {
    cursor: pointer;
    border-radius: var(--goa-border-radius-m);
    padding: var(--goa-space-2xs);
  }
  > .goa-icon-button + .goa-icon-button {
    margin-left: var(--goa-space-none);
  }
`;
