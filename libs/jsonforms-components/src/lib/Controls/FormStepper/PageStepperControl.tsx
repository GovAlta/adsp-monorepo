import React, { useContext, useEffect, useState } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup, GoAButtonType } from '@abgov/react-components-new';
import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { withAjvProps } from '../../util/layout';
import { PageRenderPadding, PageBorder } from './styled-components';
import { JsonFormContext } from '../../Context';
import { Visible } from '../../util';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { CategorizationStepperLayoutRendererProps } from './types';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { CategorizationElement } from './context/types';
import { BackButton } from './BackButton';

export interface FormPageOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

const summaryLabel = 'Summary';

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
  const { uischema, data, schema, path, cells, renderers, visible, t } = props;

  const enumerators = useContext(JsonFormContext);
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const { validatePage, goToPage } = formStepperCtx as JsonFormsStepperContextProps;

  const { categories, isOnReview, isValid, activeId } = (
    formStepperCtx as JsonFormsStepperContextProps
  ).selectStepperState();

  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (submitForm) {
      submitForm(data);
    } else {
      setIsOpen(true);
    }
  };

  const onCloseModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    validatePage(activeId);
  }, [data]);

  return (
    <div data-testid="form-stepper-test-wrapper">
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-pages`}>
          <PageBorder>
            {categories?.map((category, index) => {
              const props: StepProps = {
                category: category.uischema as CategorizationElement,
                categoryIndex: category.id,
                visible: category?.visible as boolean,
                enabled: category?.isEnabled as boolean,
                path,
                schema,
                renderers,
                cells,
                data,
              };

              if (index === activeId && !isOnReview) {
                return (
                  <div
                    data-testid={`step_${index}-content-pages`}
                    key={`${category.label}`}
                    style={{ marginTop: '1.5rem' }}
                  >
                    {index > 0 && <BackButton testId="back-button" link={() => goToPage(activeId - 1)} text="Back" />}
                    <PageRenderPadding>
                      <h3>
                        Step {index + 1} of {categories.length}
                      </h3>
                      <RenderStepElements {...props} />
                    </PageRenderPadding>
                    <PageRenderPadding>
                      {index !== categories.length - 1 ? (
                        <GoAButton
                          type="submit"
                          onClick={() => goToPage(activeId + 1)}
                          disabled={!(category.isValid && category.isCompleted)}
                          testId="pages-save-continue-btn"
                        >
                          Save and continue
                        </GoAButton>
                      ) : (
                        <GoAButtonGroup alignment="end">
                          <GoAButton
                            type={'primary'}
                            onClick={handleSubmit}
                            disabled={!isValid}
                            testId="pages-submit-btn"
                          >
                            Submit
                          </GoAButton>
                        </GoAButtonGroup>
                      )}
                    </PageRenderPadding>
                  </div>
                );
              }
            })}
          </PageBorder>
        </div>
      </Visible>
      <GoAModal
        testId="submit-confirmation"
        open={isOpen}
        heading={'Form Submitted'}
        width="640px"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton type="primary" testId="close-submit-modal" onClick={onCloseModal}>
              Close
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
      </GoAModal>
    </div>
  );
};

export const FormStepperPagesControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormPageStepper)));

export default FormPageStepper;
