import { GoAButton } from '@abgov/react-components';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { TestProps } from '@abgov/react-components/experimental/common';
import { IconType } from '@abgov/react-components/experimental/icons';
import React, { FC } from 'react';
import styled from 'styled-components';


interface ContextMenuIconProps extends TestProps {
    type: IconType;
    onClick: () => void;
}

interface ContextMenuTextProps extends TestProps {
    type: IconType;
    onClick: () => void;
}

export const GoAContextMenuIcon: FC<ContextMenuIconProps> = (props) => {
  return (
    <GoAIconButton type={props.type} onClick={props.onClick} testId={ props.testId } size='small' variant='goa' />
  )
}

export const GoAContextMenuText: FC<ContextMenuTextProps> = (props) => {
  return (
    <GoAButton buttonType="tertiary" onClick={props.onClick} testId={ props.testId } buttonSize={'small'} />
  )
}

export const GoAContextMenu = styled.div`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
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
