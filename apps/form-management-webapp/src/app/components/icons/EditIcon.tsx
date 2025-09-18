import React, { ReactElement } from 'react';
import { ReactComponent as Edit } from '@icons/edit.svg';

type Size = 'tiny' | 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  tiny: '14px',
  small: '18px',
  medium: '27px',
  large: '54px',
};

export function EditIcon({ size }: Props): ReactElement {
  return (
    <Edit
      style={{ color: `var(--color-blue-500)`, fill: `var(--color-blue-500)`, cursor: 'pointer', fontSize: `${size}` }}
      width={sizeMap[size]}
    />
  );
}
interface IconProps {
  title?: string;
  iconSize?: Size;
  onClick?: () => void;
  testId?: string;
}

export function EditIconButton({ onClick, iconSize = 'medium', title, testId }: IconProps): JSX.Element {
  return (
    <div
      title={title}
      data-testid={testId}
      onClick={onClick}
      style={{
        border: 'none',
      }}
    >
      <EditIcon size={iconSize}></EditIcon>
    </div>
  );
}
