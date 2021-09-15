import React, { ReactElement } from 'react';
import { ReactComponent as Close } from '@icons/close-circle-outline.svg';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

function CloseCircle({ size }: Props): ReactElement {
  return <Close style={{ color: `var(--color-red)` }} width={sizeMap[size]} />;
}

export default CloseCircle;
