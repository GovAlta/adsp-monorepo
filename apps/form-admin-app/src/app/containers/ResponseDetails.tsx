import { GoabButton, GoabButtonGroup, GoabFormItem, GoabModal } from '@abgov/react-components';
import { ResizableSplitPane } from '@core-services/app-common';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  formBusySelector,
  canArchiveSelector,
  canSetToDraftSelector,
  definitionSelector,
  directoryBusySelector,
  dispositionDraftSelector,
  formFilesSelector,
  formSelector,
  FormStatus,
  loadTopic,
  Resource,
  runFormOperation,
  selectForm,
  selectSubmission,
  selectTopic,
  submissionSelector,
  tagResource,
} from '../state';
import { FormViewer } from './FormViewer';
import { ReviewWorkspace } from './ReviewWorkspace';
import { AddTagModal } from '../components/AddTagModal';
import { DetailsLayout } from '../components/DetailsLayout';
import { ContentContainer } from '../components/ContentContainer';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { PdfDownload } from './PdfDownload';
import { AdspId } from '../../lib/adspId';
import { ActionsForm } from '../components/ActionsForm';

const ResponseContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

// A response is the form; when the definition creates submission records, the review workspace acts
// on the submission of the response.
export const ResponseDetails = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { formId } = useParams();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showTagResponse, setShowTagResponse] = useState<Pick<Resource, 'name' | 'urn'>>(null);
  const [hideWorkspace, setHideWorkspace] = useState(false);

  const definition = useSelector(definitionSelector);
  const { form, next } = useSelector(formSelector);
  const { submission } = useSelector(submissionSelector);

  const files = useSelector(formFilesSelector);
  const directoryBusy = useSelector(directoryBusySelector);
  const draft = useSelector(dispositionDraftSelector);

  const busy = useSelector(formBusySelector);
  const canSetToDraft = useSelector(canSetToDraftSelector);
  const canArchive = useSelector(canArchiveSelector);

  useEffect(() => {
    dispatch(selectForm(formId));
  }, [dispatch, formId]);

  // The form carries only the identifier of its submission, so the record behind the review
  // workspace is loaded once the form resolves.
  const submissionId = form?.submission?.id;
  useEffect(() => {
    if (submissionId) {
      dispatch(selectSubmission(submissionId));
    }
  }, [dispatch, submissionId]);

  useEffect(() => {
    if (form) {
      (async () => {
        await dispatch(loadTopic({ resourceId: form.urn, typeId: 'form-questions' }));
        await dispatch(selectTopic({ resourceId: form.urn }));
      })();
    }
  }, [dispatch, definition, form]);

  const onOpenTag = useCallback(() => {
    if (form) {
      setShowTagResponse({ name: '', urn: form.urn });
    }
  }, [form]);

  const formUrn =
    form &&
    `urn:ads:platform:form-service:v1:/forms/${form.id}${form.submission ? `/submissions/${form.submission.id}` : ''}`;

  return (
    <DetailsLayout
      initialized={!!(definition && form)}
      nextTo={next && `../responses/${next}`}
      header={
        form && (
          <>
            <PropertiesContainer>
              <GoabFormItem mr="xl" mb="s" label="Status">
                {form.status}
              </GoabFormItem>
              <GoabFormItem mr="xl" mb="s" label="Applicant">
                {form.applicant?.addressAs}
              </GoabFormItem>
              <GoabFormItem mr="s" mb="s" label="Created by">
                {form.createdBy.name}
              </GoabFormItem>
              <GoabFormItem mr="xl" mb="s" label="Created on">
                {DateTime.fromISO(form.created).toFormat('LLL d, yyyy')}
              </GoabFormItem>
              <GoabFormItem mr="xl" mb="s" label="Submitted on">
                {form.submitted && DateTime.fromISO(form.submitted).toFormat('LLL d, yyyy')}
              </GoabFormItem>
              <GoabFormItem mr="s" mb="s" label="Dry run">
                {form.dryRun ? 'true' : 'false'}
              </GoabFormItem>
              {form.submitted && <PdfDownload urn={formUrn} />}
            </PropertiesContainer>
            <GoabButtonGroup alignment="end" mr="l" mb="m">
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
    >
      <ResizableSplitPane
        initialLeftPercent={40}
        testId="workSpacekeyResizePane"
        left={
          <ResponseContainer>
            <ContentContainer>
              <FormViewer
                dataSchema={definition?.dataSchema}
                uiSchema={definition?.uiSchema}
                data={form?.data}
                files={{ ...files }}
              />
            </ContentContainer>
            <ActionsForm>
              <GoabButtonGroup alignment="end">
                {form?.status === FormStatus.submitted && canSetToDraft && (
                  <GoabButton
                    size="compact"
                    type="secondary"
                    disabled={busy.executing}
                    onClick={() => dispatch(runFormOperation({ urn: AdspId.parse(form.urn), operation: 'to-draft' }))}
                  >
                    Set to draft
                  </GoabButton>
                )}
                {form?.status !== FormStatus.archived && canArchive && (
                  <GoabButton
                    size="compact"
                    type={form?.status === FormStatus.submitted ? 'primary' : 'secondary'}
                    disabled={busy.executing}
                    onClick={() => setShowArchiveConfirm(true)}
                  >
                    Archive form
                  </GoabButton>
                )}
              </GoabButtonGroup>
            </ActionsForm>
          </ResponseContainer>
        }
        rightHidden={hideWorkspace}
        right={
          <ReviewWorkspace
            dispatch={dispatch}
            definition={definition}
            form={form}
            submission={submission}
            draft={draft}
            busy={busy}
            onOpenTag={onOpenTag}
          />
        }
        minPaneWidth={200}
      />
      <GoabModal heading="Archive this form?" open={showArchiveConfirm}>
        <div>
          Archiving the form will change its status to "Archived" so it can be separated from forms that are still being
          actively worked on. The applicant will no longer be able to update the form.
        </div>
        <GoabButtonGroup alignment="end" mt="xl">
          <GoabButton size="compact" type="secondary" onClick={() => setShowArchiveConfirm(false)}>
            Cancel
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            onClick={() => {
              dispatch(runFormOperation({ urn: AdspId.parse(form.urn), operation: 'archive' }));
              setShowArchiveConfirm(false);
            }}
          >
            Archive form
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
      <AddTagModal
        open={!!showTagResponse}
        resource={showTagResponse}
        tagging={directoryBusy.executing}
        onClose={() => setShowTagResponse(null)}
        onTag={async (urn, label) => {
          await dispatch(tagResource({ urn, label }));
          setShowTagResponse(null);
        }}
      />
    </DetailsLayout>
  );
};
