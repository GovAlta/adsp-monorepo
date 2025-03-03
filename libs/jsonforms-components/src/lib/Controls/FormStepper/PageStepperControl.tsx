import { useContext, useEffect, useState } from 'react';
import { GoAButtonType } from '@abgov/react-components';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { withAjvProps } from '../../util/layout';
import { PageBorder } from './styled-components';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { BackButton } from './BackButton';
import { TableOfContents, TocProps } from './TableOfContents';
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
  const { validatePage, goToPage } = formStepperCtx as JsonFormsStepperContextProps;

  const { categories, activeId } = (formStepperCtx as JsonFormsStepperContextProps).selectStepperState();

  useEffect(() => {
    validatePage(activeId);
  }, [data]);

  const [showTOC, setShowTOC] = useState(true);

  const handleGoToPage = (index: number) => {
    setShowTOC(false);
    goToPage(index);
  };

  // Make sure the back button on the first page takes us to the Table of Contents.
  const renderBackButton = (index: number, activeId: number): JSX.Element => {
    if (index > 0) {
      return <BackButton testId="back-button" link={() => goToPage(activeId - 1)} text="Back" />;
    }
    return <BackButton testId="back-button" link={() => setShowTOC(true)} text="Back" />;
  };

  if (showTOC) {
    const tocProps: TocProps = { categories, onClick: handleGoToPage };
    return <TableOfContents {...tocProps} />;
  } else {
    return <RenderPages categoryProps={props} renderBackButton={renderBackButton}></RenderPages>;
  }
};

export const FormStepperPagesControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormPageStepper)));

export default FormPageStepper;
