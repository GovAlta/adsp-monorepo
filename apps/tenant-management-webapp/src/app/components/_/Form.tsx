import React from 'react';
import styled from 'styled-components';

function GoAForm(props) {
  return (
    <div className="goa-form" style={{ marginBottom: '2rem' }}>
      {props.children}
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

  button:last-of-type {
    margin-right: 0;
  }
`;

export { GoAForm, GoAFormButtons, GoAFormItem };
