import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  formBusySelector,
  definitionSelector,
  dispositionDraftSelector,
  formActions,
  selectSubmission,
  submissionFilesSelector,
  submissionSelector,
  updateFormDisposition,
  Resource,
  directoryBusySelector,
  tagResource,
} from '../state';
import { AddTagModal } from '../components/AddTagModal';
import { AdspId } from '../../lib/adspId';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { FormViewer } from './FormViewer';
import { PdfDownload } from './PdfDownload';
import { GoabDropdownOnChangeDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { ResizableSplitPane } from '@core-services/app-common';
import { GoabAccordion } from '@abgov/react-components';
import styled from 'styled-components';
import { Tags } from './Tags';

const AccordianDisplayDiv = styled.main`
  display: block;
  padding: var(--goa-space-xl);
  overflow: auto;
`;

const ACCORDIAN_MAX_WIDTH = '1200px';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [showTagSubmission, setShowTagSubmission] = useState<Pick<Resource, 'name' | 'urn'>>(null);
  const [hideWorkspace, setHideWorkspace] = useState(false);

  const { submissionId } = useParams();
  const busy = useSelector(formBusySelector);
  const definition = useSelector(definitionSelector);
  const { submission, next } = useSelector(submissionSelector);
  const files = useSelector(submissionFilesSelector);
  const directoryBusy = useSelector(directoryBusySelector);
  const draft = useSelector(dispositionDraftSelector);
  const [formSubmissionUrn, setFormSubmissionUrn] = useState<string>(null);

  useEffect(() => {
    dispatch(selectSubmission(submissionId));
  }, [dispatch, submissionId]);

  useEffect(() => {
    if (submission) {
      const urn = `urn:ads:platform:form-service:v1:/forms/${submission.formId}${
        submission.id ? `/submissions/${submission.id}` : ''
      }`;
      setFormSubmissionUrn(urn);
    }
  }, [submission]);

  const onOpenTag = useCallback(() => {
    if (!submission) return;
    setShowTagSubmission({ name: '', urn: submission.urn });
  }, [submission]);

  const RightPaneWorkSpaceAccordians = () => {
    return (
      <AccordianDisplayDiv>
        <GoabAccordion heading="Communication/Messages" maxWidth={ACCORDIAN_MAX_WIDTH} mb="m">
          Communication section
          {/* TODO: Add Communication/Messages content */}
        </GoabAccordion>
        <GoabAccordion heading="Notes" maxWidth={ACCORDIAN_MAX_WIDTH} mb="m">
          Notes section
          {/* TODO: Add Notes content */}
        </GoabAccordion>
        <GoabAccordion heading="Tags" maxWidth={ACCORDIAN_MAX_WIDTH} mb="m">
          <Tags urn={submission.urn} showButtonText={true} onTag={onOpenTag} />
        </GoabAccordion>
        <GoabAccordion heading="History" maxWidth={ACCORDIAN_MAX_WIDTH} mb="m">
          History section
          {/* TODO: Add History content */}
        </GoabAccordion>

        <GoabAccordion heading="Disposition" maxWidth={ACCORDIAN_MAX_WIDTH} mb="m">
          {submission?.disposition ? (
            <PropertiesContainer>
              <GoabFormItem ml="xl" label="Disposition">
                <span>{submission.disposition.status}</span>
              </GoabFormItem>
              <GoabFormItem ml="xl" label="Reason">
                <span>{submission.disposition.reason}</span>
              </GoabFormItem>
              <GoabFormItem ml="xl" label="Dispositioned on">
                <span>{DateTime.fromISO(submission.disposition.date).toFormat('LLL d, yyyy')}</span>
              </GoabFormItem>
            </PropertiesContainer>
          ) : (
            <>
              <GoabFormItem label="Disposition">
                <GoabDropdown
                  width="200px"
                  size="compact"
                  value={draft.status || ''}
                  onChange={(detail: GoabDropdownOnChangeDetail) =>
                    dispatch(formActions.setDispositionDraft({ ...draft, status: detail.value }))
                  }
                  mb={'m'}
                >
                  <GoabDropdownItem value={''} label={'None selected'} />
                  {definition?.dispositionStates?.map((state) => (
                    <GoabDropdownItem key={state.id} value={state.name} label={state.name} />
                  ))}
                </GoabDropdown>
              </GoabFormItem>
              <GoabFormItem label="Reason">
                <GoabTextArea
                  name="reason"
                  value={draft.reason}
                  onChange={(detail: GoabTextAreaOnChangeDetail) =>
                    dispatch(formActions.setDispositionDraft({ ...draft, reason: detail.value }))
                  }
                  mb={'m'}
                />
              </GoabFormItem>
              <GoabButtonGroup alignment="start">
                <GoabButton
                  size="compact"
                  disabled={!draft.status || !draft.reason || busy.executing}
                  onClick={() =>
                    dispatch(
                      updateFormDisposition({
                        submissionUrn: `/forms/${submission.formId}${AdspId.parse(submission.urn).resource}`,
                        status: draft.status,
                        reason: draft.reason,
                      }),
                    )
                  }
                >
                  Disposition
                </GoabButton>
              </GoabButtonGroup>
            </>
          )}
        </GoabAccordion>
      </AccordianDisplayDiv>
    );
  };
  return (
    <DetailsLayout
      initialized={!!(definition && submission)}
      navButtons={
        submission?.formId && (
          <GoabButton type="secondary" size="compact" onClick={() => navigate(`../forms/${submission.formId}`)}>
            Go to related form
          </GoabButton>
        )
      }
      nextTo={next && `../submissions/${next}`}
      header={
        submission && (
          <>
            <PropertiesContainer>
              <GoabFormItem mr="s" mb="s" label="Submitted by">
                {submission.createdBy.name}
              </GoabFormItem>
              <GoabFormItem mr="xl" mb="s" label="Submitted on">
                {DateTime.fromISO(submission.created).toFormat('LLL d, yyyy')}
              </GoabFormItem>
              <PdfDownload urn={formSubmissionUrn} />
            </PropertiesContainer>
            <GoabButtonGroup alignment="end" mr={'l'} mb={'m'}>
              <GoabButton
                leadingIcon={hideWorkspace ? 'eye' : 'eye-off'}
                type="secondary"
                size="compact"
                onClick={() => setHideWorkspace(!hideWorkspace)}
              >
                {hideWorkspace ? 'Show workspace' : 'Hide workspace'}
              </GoabButton>
            </GoabButtonGroup>
          </>
        )
      }
      actionsForm={null}
    >
      <ResizableSplitPane
        initialLeftPercent={40}
        testId="workSpacekeyResizePane"
        left={
          <ContentContainer>
            <FormViewer
              dataSchema={definition?.dataSchema}
              uiSchema={definition?.uiSchema}
              data={submission?.formData}
              files={files}
            />
          </ContentContainer>
        }
        rightHidden={hideWorkspace}
        right={<RightPaneWorkSpaceAccordians />}
        minPaneWidth={200}
      ></ResizableSplitPane>
      <AddTagModal
        open={!!showTagSubmission}
        resource={showTagSubmission}
        tagging={directoryBusy.executing}
        onClose={() => setShowTagSubmission(null)}
        onTag={async (urn, label) => {
          await dispatch(tagResource({ urn, label }));
          setShowTagSubmission(null);
        }}
      />
    </DetailsLayout>
  );
};
