import React, { ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface LinkButtonProps {
  to: string;
  buttonType: 'primary' | 'secondary' | 'tertiary';
}

function GoALinkButton({
  to,
  buttonType,
  children,
  ...props
}: LinkButtonProps & LinkProps & { children: ReactNode }): JSX.Element {
  return (
    <Link to={to} className={`goa-link-button goa--${buttonType}`} {...props}>
      {children}
    </Link>
  );
}

export default GoALinkButton;
