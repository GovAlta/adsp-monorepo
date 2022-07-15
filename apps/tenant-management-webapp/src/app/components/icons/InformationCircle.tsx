import React, { ReactElement } from 'react';
import { ReactComponent as Information } from '@icons/information-circle.svg';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

function InformationCircle({ size }: Props): ReactElement {
  return <Information style={{ color: `var(--color-red)` }} width={sizeMap[size]} />;
}

export default InformationCircle;
