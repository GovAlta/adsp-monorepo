import React, { FormEvent, ReactNode } from 'react';
import styled from 'styled-components';

interface GoAFormProps {
  onSubmit?: (e: FormEvent<Element>) => void;
}

function GoAForm(props: GoAFormProps & { children: ReactNode }): JSX.Element {
  return (
    <div className="goa-form" style={{ marginBottom: '2rem' }}>
      <form {...props}>{props.children}</form>
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
  }

  button {
    margin: 0;
  }

  button + button {
    margin-left: 1rem;
  }
`;

export { GoAForm, GoAFormButtons, GoAFormItem };
