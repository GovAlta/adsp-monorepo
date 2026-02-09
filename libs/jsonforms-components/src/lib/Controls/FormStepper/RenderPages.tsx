import { useRef } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal, GoabGrid } from '@abgov/react-components';
import { Visible } from '../../util';
import { PageBorder, PageRenderPadding } from './styled-components';
import FormStepperPageReviewer from './PageStepperReviewControl';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { CategorizationElement, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { CategorizationStepperLayoutRendererProps } from './types';
import { useContext, useState } from 'react';
import { JsonFormContext } from '../../Context';
import { BackButton } from './BackButton';

export interface PageRenderingProps {
  categoryProps: CategorizationStepperLayoutRendererProps;
}

export const RenderPages = (props: PageRenderingProps): JSX.Element => {
  const { data, schema, path, cells, renderers, visible, enabled } = props.categoryProps;
  const enumerators = useContext(JsonFormContext);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const { goToPage, toggleShowReviewLink, goToTableOfContext, validatePage } =
    formStepperCtx as JsonFormsStepperContextProps;
  const { categories, isOnReview, isValid, activeId, validationTrigger } = (
    formStepperCtx as JsonFormsStepperContextProps
  ).selectStepperState();

  const hideSubmit = props.categoryProps.uischema.options?.hideSubmit ?? false;
  const toAppOverviewLabel = props.categoryProps.uischema.options?.toAppOverviewLabel ?? 'Back to application overview';
  const submissionLabel = props.categoryProps.uischema.options?.submissionLabel ?? 'Next';
  const hideSummary = props.categoryProps.uischema.options?.hideSummary;
  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();

  const saveFormFunction = enumerators?.saveFunction.get('save-form');
  const saveForm = saveFormFunction && saveFormFunction();

  const [isOpen, setIsOpen] = useState(false);
  const topElementRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (submitForm) {
      submitForm(data);
    } else {
      setIsOpen(true);
    }
  };

  const handleSave = () => {
    if (saveForm) {
      saveForm(data);
    }
  };

  const onCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div data-testid="form-stepper-test-wrapper" ref={topElementRef}>
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-pages`}>
          <PageBorder>
            <BackButton
              text={toAppOverviewLabel}
              link={() => {
                handleSave();
                goToTableOfContext();
              }}
              testId="back-to-tasks"
            />
            {
              //eslint-disable-next-line
              categories?.map((category, index) => {
                const categoryProps: StepProps = {
                  category: category.uischema as CategorizationElement,
                  categoryIndex: category.id,
                  visible: category?.visible as boolean,
                  enabled: category?.isEnabled as boolean,
                  path,
                  schema,
                  renderers,
                  cells,
                  data,
                  validationTrigger,
                };

                const currentStep = index + 1 - categories.filter((c) => !c.visible && c.id < index).length;
                const totalSteps = categories.filter((c) => c.visible).length;
                const isActive = index === activeId && !isOnReview;

                return (
                  <Visible visible={isActive} key={`page-${category.id}`}>
                    <div data-testid={`step_${index}-content-pages`} style={{ marginTop: '1.5rem' }}>
                      <PageRenderPadding>
                        <h3>
                          Step {currentStep} of {totalSteps}
                        </h3>
                        <RenderStepElements {...categoryProps} />
                      </PageRenderPadding>
                      <PageRenderPadding>
                        <GoabGrid minChildWidth="100px" gap="2xs">
                          <GoabButtonGroup alignment="start">
                            {activeId > 0 && (
                              <GoabButton
                                type="secondary"
                                onClick={() => {
                                  handleSave();
                                  let prevId = activeId - 1;
                                  while (prevId >= 0 && categories[prevId].visible === false) {
                                    prevId = prevId - 1;
                                  }
                                  if (prevId >= 0) {
                                    if (topElementRef.current) {
                                      topElementRef.current.scrollIntoView();
                                    }
                                    goToPage(prevId);
                                  }
                                }}
                                testId="pages-prev-btn"
                              >
                                Previous
                              </GoabButton>
                            )}{' '}
                          </GoabButtonGroup>

                          <GoabButtonGroup alignment="end">
                            <GoabButton
                              type="submit"
                              onClick={() => {
                                handleSave();
                                let nextId = activeId + 1;
                                while (nextId < categories.length && categories[nextId].visible === false) {
                                  nextId = nextId + 1;
                                }
                                if (!(currentStep === totalSteps && hideSummary)) {
                                  if (topElementRef.current) {
                                    topElementRef.current.scrollIntoView();
                                  }
                                  goToPage(nextId);
                                }
                              }}
                              disabled={!enabled}
                              testId="pages-save-continue-btn"
                            >
                              {currentStep === totalSteps ? submissionLabel : 'Next'}
                            </GoabButton>
                          </GoabButtonGroup>
                        </GoabGrid>
                      </PageRenderPadding>
                    </div>
                  </Visible>
                );
              })
            }

            {isOnReview && (
              <div data-testid="stepper-pages-review-page">
                <FormStepperPageReviewer {...{ ...props.categoryProps, navigationFunc: goToPage }} />
                <PageRenderPadding>
                  <GoabGrid minChildWidth="100px" gap="2xs">
                    <GoabButtonGroup alignment="end">
                      {!hideSubmit ? (
                        <GoabButton
                          type={'primary'}
                          onClick={handleSubmit}
                          disabled={!isValid}
                          testId="pages-submit-btn"
                        >
                          Submit
                        </GoabButton>
                      ) : null}
                    </GoabButtonGroup>
                  </GoabGrid>
                </PageRenderPadding>
              </div>
            )}
          </PageBorder>
        </div>
      </Visible>
      <GoabModal
        testId="submit-confirmation"
        open={isOpen}
        heading={'Form Submitted'}
        maxWidth="640px"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton type="primary" testId="close-submit-modal" onClick={onCloseModal}>
              Close
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
      </GoabModal>
    </div>
  );
};
