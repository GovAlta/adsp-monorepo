import React, { useContext } from 'react';
import { GoACallout } from '@abgov/react-components';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { CompletionStatus } from './styled-components';

export const ApplicationStatus = (): JSX.Element => {
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const { selectNumberOfCompletedCategories } = formStepperCtx as JsonFormsStepperContextProps;

  const { categories: allCategories } = (formStepperCtx as JsonFormsStepperContextProps).selectStepperState();
  const categories = allCategories.filter(
    (c) =>
      c?.visible === true && (c.uischema?.options?.showInTaskList || c?.uischema?.options?.showInTaskList === undefined)
  );
  const total = categories.length;
  const completed = selectNumberOfCompletedCategories();
  const type = total === completed ? 'success' : 'important';
  const heading = total === completed ? 'Application completed' : 'Application incomplete';
  const message = `You have completed ${completed} of ${total} sections.`;
  return (
    <CompletionStatus>
      <GoACallout type={type} heading={heading} size="medium" maxWidth={'50%'}>
        {message}
      </GoACallout>
    </CompletionStatus>
  );
};
