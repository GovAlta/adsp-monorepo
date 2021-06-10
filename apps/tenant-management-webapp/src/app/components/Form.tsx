import React, { FormEvent, ReactNode } from 'react';
import styled from 'styled-components';

interface GoAFormProps {
  onSubmit?: (e: FormEvent<Element>) => void;
}

function GoAForm(props: GoAFormProps & { children: ReactNode }): JSX.Element {
  const { children, onSubmit, ..._props } = props;
  return (
    // FIXME: position: relative is required to allow the height of the dropdown menu to be calculated wrt to the form, rather than the page
    <div className="goa-form" style={{ position: 'relative' }}>
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
