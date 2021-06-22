import React, { ReactElement } from 'react';
import { ReactComponent as Checkmark } from '@icons/checkmark-circle-outline.svg';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

function CheckmarkCircle({ size }: Props): ReactElement {
  return <Checkmark style={{ color: `var(--color-green-700)` }} width={sizeMap[size]} />;
}

export default CheckmarkCircle;
