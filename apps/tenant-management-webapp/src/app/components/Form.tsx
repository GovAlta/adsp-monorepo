import React, { FormEvent, ReactNode } from 'react';
import styled from 'styled-components';

interface GoAFormProps {
  onSubmit?: (e: FormEvent<Element>) => void;
}

function GoAForm(props: GoAFormProps & { children: ReactNode }): JSX.Element {
  const { children, onSubmit, ..._props } = props;
  return (
    <GoAFormContainer>
      {onSubmit ? (
        <form onSubmit={onSubmit} {..._props}>
          {children}
        </form>
      ) : (
        children
      )}
    </GoAFormContainer>
  );
}

const GoAFormContainer = styled.div`
  // FIXME: position: relative is required to allow the height of the dropdown menu to be calculated wrt to the form, rather than the page
  /* position: relative; */
`;

const GoAFormItem = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    font-weight: var(--fw-bold);
    color: #333;
  }

  input,
  textarea {
    width: 100%;
    border-radius: 4px;
    border: 1px solid var(--color-gray-600);
    padding: 0.5rem;
  }

  .error-msg {
    display: none;
  }

  &.error {
    label {
      color: var(--color-red);
    }
    input,
    textarea {
      border-color: var(--color-red);
    }
    .error-msg {
      display: block;
      color: var(--color-red);
    }
  }
`;

const GoAFormButtons = styled.div`
  margin-top: 2rem;
  margin-bottom: 1rem;

  @media (max-width: 639px) {
    button + button,
    button + .goa-link-button,
    .goa-link-button + button,
    .goa-link-button + .goa-link-button {
      margin-top: 0.5rem !important;
    }
  }

  @media (min-width: 640px) {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;

    button {
      min-width: 6rem;
    }

    button + button,
    button + .goa-link-button,
    .goa-link-button + button,
    .goa-link-button + .goa-link-button {
      margin-left: 0.5rem;
    }
  }

  button {
    margin: 0;
  }
`;

export { GoAForm, GoAFormButtons, GoAFormItem };
