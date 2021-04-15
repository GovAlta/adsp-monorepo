import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LinkButtonProps {
  to: string;
  buttonType: 'primary' | 'secondary' | 'tertiary';
}

function GoALinkButton(props: LinkButtonProps & { children: ReactNode }) {
  return (
    <Link to={props.to} className={`goa-link-button goa--${props.buttonType}`}>
      {props.children}
    </Link>
  );
}

export default GoALinkButton;
