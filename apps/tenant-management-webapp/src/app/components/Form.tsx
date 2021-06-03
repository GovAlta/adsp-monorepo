import React, { FormEvent, ReactNode } from 'react';
import styled from 'styled-components';

interface GoAFormProps {
  onSubmit?: (e: FormEvent<Element>) => void;
}

function GoAForm(props: GoAFormProps & { children: ReactNode }): JSX.Element {
  const { children, onSubmit, ..._props } = props;
  return (
    <div className="goa-form">
      {onSubmit ? (
        <form onSubmit={onSubmit} {..._props}>
          {children}
        </form>
      ) : (
        children
      )}
    </div>
  );
}

const GoAFormItem = styled.div``;

const GoAFormButtons = styled.div`
  margin-top: 2rem;
  @media (min-width: 640px) {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;

    button {
      min-width: 6rem;
    }

    button + button {
      margin-left: 0.5rem;
    }
  }

  button {
    margin: 0;
  }
`;

export { GoAForm, GoAFormButtons, GoAFormItem };
