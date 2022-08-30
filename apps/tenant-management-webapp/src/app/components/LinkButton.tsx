import React, { ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface LinkButtonProps {
  to: string;
  buttonType: 'primary' | 'secondary' | 'tertiary';
}
interface ChildrenProps {
  children: ReactNode;
}

const GoALinkButton: React.FC<LinkButtonProps & LinkProps & ChildrenProps> = ({
  to,
  buttonType,
  children,
  ...props
}: LinkButtonProps & LinkProps & ChildrenProps): JSX.Element => {
  return (
    <Link to={to} className={`goa-link-button goa--${buttonType}`} {...props}>
      {children}
    </Link>
  );
};

export default GoALinkButton;
