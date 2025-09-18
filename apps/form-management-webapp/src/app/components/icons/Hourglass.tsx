import React, { ReactElement } from 'react';
import { ReactComponent as Hourglass } from '@icons/hourglass-outline.svg';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

function Icon({ size }: Props): ReactElement {
  return <Hourglass style={{ color: `var(--color-gray-700)` }} width={sizeMap[size]} />;
}

export default Icon;
