import React, { useContext, useState } from 'react';
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

  const { categories, isOnReview, isValid } = (formStepperCtx as JsonFormsStepperContextProps).selectStepperState();

  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const optionProps = (uischema.options as FormPageOptionProps) || {};
  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [selectedPage, setSelectedPage] = useState(0);

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

  // eslint-disable-next-line
  const options = (uischema as any).options;

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

              if (index === selectedPage && !isOnReview) {
                return (
                  <div
                    data-testid={`step_${index}-content-pages`}
                    key={`${category.label}`}
                    style={{ marginTop: '1.5rem' }}
                  >
                    {index > 0 && (
                      <BackButton testId="back-button" link={() => setSelectedPage(index - 1)} text="Back" />
                    )}
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
                          onClick={() => setSelectedPage(index + 1)}
                          disabled={!category.isValid}
                          testId="pages-save-continue-btn"
                        >
                          Save and continue
                        </GoAButton>
                      ) : (
                        <GoAButton
                          type={'primary'}
                          onClick={handleSubmit}
                          disabled={!isValid}
                          testId="pages-submit-btn"
                        >
                          Submit
                        </GoAButton>
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
