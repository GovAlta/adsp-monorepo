import React from 'react';

import styled from 'styled-components';
interface CheckboxGroupProps {
  orientation?: CheckboxGroupOrientation;
  testId?: string;
  children?: React.ReactNode;
}

export type CheckboxGroupOrientation = 'horizontal' | 'vertical';

const Checkboxes = ({ children, orientation, testId }: CheckboxGroupProps): JSX.Element => {
  return (
    <CheckBoxGroupDiv data-testid={testId} className={orientation}>
      {children}
    </CheckBoxGroupDiv>
  );
};

export default Checkboxes;

const CheckBoxGroupDiv = styled.div`
  .horizontal {
    display: flex;
    flex-direction: row;
  }

  .vertical {
    display: inline-block;
  }
`;
