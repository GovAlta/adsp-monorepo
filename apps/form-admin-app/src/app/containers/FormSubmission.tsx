import { GoabButton, GoabButtonGroup, GoabFormItem } from '@abgov/react-components';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppDispatch,
  formBusySelector,
  definitionSelector,
  dispositionDraftSelector,
  selectSubmission,
  submissionFilesSelector,
  submissionSelector,
  Resource,
  directoryBusySelector,
  tagResource,
} from '../state';
import { AddTagModal } from '../components/AddTagModal';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { FormViewer } from './FormViewer';
import { PdfDownload } from './PdfDownload';
import { ResizableSplitPane } from '@core-services/app-common';

import { WorkspaceAccordions } from './WorkspaceAccordions';

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
        right={
          <WorkspaceAccordions
            dispatch={dispatch}
            definition={definition}
            submission={submission}
            draft={draft}
            busy={busy}
            onOpenTag={onOpenTag}
          />
        }
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
