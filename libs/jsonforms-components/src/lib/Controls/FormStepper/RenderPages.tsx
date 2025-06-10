import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components';
import { Visible } from '../../util';
import { PageBorder, PageRenderPadding, PageRenderPaddingBottom } from './styled-components';
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
  const { data, schema, path, cells, renderers, visible } = props.categoryProps;
  const enumerators = useContext(JsonFormContext);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const { goToPage, toggleShowReviewLink, goToTableOfContext, validatePage } =
    formStepperCtx as JsonFormsStepperContextProps;
  const { categories, isOnReview, isValid, activeId } = (
    formStepperCtx as JsonFormsStepperContextProps
  ).selectStepperState();

  const hideSubmit = props.categoryProps.uischema.options?.hideSubmit ?? false;
  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();

  const saveFormFunction = enumerators?.saveFunction.get('save-form');
  const saveForm = saveFormFunction && saveFormFunction();

  const [isOpen, setIsOpen] = useState(false);

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
    <div data-testid="form-stepper-test-wrapper">
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-pages`}>
          <PageBorder>
            {categories?.map((category, index) => {
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
              };

              if (index === activeId && !isOnReview) {
                return (
                  <div
                    data-testid={`step_${index}-content-pages`}
                    key={`${category.label}`}
                    style={{ marginTop: '1.5rem' }}
                  >
                    <BackButton
                      testId="back-button"
                      link={() => {
                        validatePage(index);
                        goToTableOfContext();
                      }}
                      text="Back"
                    />
                    <PageRenderPadding>
                      <h3>
                        Step {index + 1 - categories.filter((c) => !c.visible && c.id < index).length} of{' '}
                        {categories.filter((c) => c.visible).length}
                      </h3>
                      <RenderStepElements {...categoryProps} />
                    </PageRenderPadding>
                    <PageRenderPadding>
                      <GoAButtonGroup alignment="start">
                        <GoAButton
                          type="submit"
                          onClick={() => {
                            handleSave();
                            let nextId = activeId + 1;
                            while (nextId < categories.length && categories[nextId].visible === false) {
                              nextId = nextId + 1;
                            }
                            goToPage(nextId);
                          }}
                          disabled={!(category.isValid && category.isCompleted)}
                          testId="pages-save-continue-btn"
                        >
                          Save and continue
                        </GoAButton>
                        {category.showReviewPageLink && (
                          <GoAButton
                            type="tertiary"
                            onClick={() => {
                              toggleShowReviewLink(activeId);
                              goToPage(categories.length);
                            }}
                            testId="pages-to-review-page-btn"
                          >
                            Back to application overview
                          </GoAButton>
                        )}
                      </GoAButtonGroup>
                    </PageRenderPadding>
                  </div>
                );
              }
            })}

            {isOnReview && (
              <div data-testid="stepper-pages-review-page">
                <PageRenderPaddingBottom>
                  <BackButton
                    testId="review-back-button"
                    link={() => {
                      goToTableOfContext();
                    }}
                    text="Back"
                  />
                </PageRenderPaddingBottom>
                <FormStepperPageReviewer {...{ ...props.categoryProps, navigationFunc: goToPage }} />
                <PageRenderPadding>
                  <GoAButtonGroup alignment="end">
                    {!hideSubmit ? (
                      <GoAButton type={'primary'} onClick={handleSubmit} disabled={!isValid} testId="pages-submit-btn">
                        Submit
                      </GoAButton>
                    ) : null}
                  </GoAButtonGroup>
                </PageRenderPadding>
              </div>
            )}
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
