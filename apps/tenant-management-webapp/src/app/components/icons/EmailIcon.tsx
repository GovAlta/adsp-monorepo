import React, { ReactElement } from 'react';
import { ReactComponent as Email } from '@icons/mail-outline.svg';

type Size = 'small' | 'medium' | 'large';

interface Props {
  size: Size;
}

const sizeMap: { [key: string]: string } = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

function EmailIcon({ size }: Props): ReactElement {
  return <Email style={{ color: `var(--color-blue-500)` }} width={sizeMap[size]} />;
}
export default EmailIcon;
