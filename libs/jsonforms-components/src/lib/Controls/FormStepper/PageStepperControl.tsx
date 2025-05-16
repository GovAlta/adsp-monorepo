import { useContext, useEffect } from 'react';
import { GoAButtonType } from '@abgov/react-components';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { withAjvProps } from '../../util/layout';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { TaskList, TocProps } from './TaskList/TaskList';
import { RenderPages } from './RenderPages';

export interface FormPageOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormPageStepper = (props: CategorizationStepperLayoutRendererProps) => {
  const formStepperCtx = useContext(JsonFormsStepperContext);
  /**
   * StepperCtx can only be provided once to prevent issues from categorization in categorization
   *  */
  if (formStepperCtx?.isProvided === true) {
    return <FormPagesView {...props} />;
  }
  return <JsonFormsStepperContextProvider StepperProps={{ ...props }} children={<FormPagesView {...props} />} />;
};

export const FormPagesView = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const data = props.data;

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const { validatePage, goToPage, selectNumberOfCompletedCategories } = formStepperCtx as JsonFormsStepperContextProps;

  const { categories, activeId } = (formStepperCtx as JsonFormsStepperContextProps).selectStepperState();

  useEffect(() => {
    validatePage(activeId);
  }, [data]);

  const handleGoToPage = (index: number) => {
    goToPage(index);
  };

  if (categories.length + 1 === activeId) {
    const tocProps: TocProps = {
      categories,
      onClick: handleGoToPage,
      title: props.uischema?.options?.title,
      subtitle: props.uischema?.options?.subtitle,
      isValid: selectNumberOfCompletedCategories() === categories.length,
    };
    return <TaskList {...tocProps} />;
  } else {
    return <RenderPages categoryProps={props}></RenderPages>;
  }
};

export const FormStepperPagesControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormPageStepper)));

export default FormPageStepper;
