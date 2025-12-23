import { GoabButton, GoabButtonGroup, GoabFormItem, GoabModal } from '@abgov/react-components';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  formBusySelector,
  canArchiveSelector,
  canSetToDraftSelector,
  definitionSelector,
  formFilesSelector,
  formSelector,
  FormStatus,
  runFormOperation,
  selectForm,
  loadTopic,
  selectTopic,
  topicSelector,
  AppState,
} from '../state';
import { FormViewer } from './FormViewer';
import { DetailsLayout } from '../components/DetailsLayout';
import { ContentContainer } from '../components/ContentContainer';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { PdfDownload } from './PdfDownload';
import { AdspId } from '../../lib/adspId';
import CommentsViewer from './CommentsViewer';
import { ActionsForm } from '../components/ActionsForm';
import { Tab, Tabs } from '../components/Tabs';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Form = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { formId } = useParams();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const definition = useSelector(definitionSelector);
  const { form, next } = useSelector(formSelector);

  const files = useSelector(formFilesSelector);
  const topic = useSelector((state: AppState) => topicSelector(state, form?.urn));

  const busy = useSelector(formBusySelector);
  const canSetToDraft = useSelector(canSetToDraftSelector);
  const canArchive = useSelector(canArchiveSelector);

  const [formUrn, setFormUrn] = useState<string>(null);

  useEffect(() => {
    dispatch(selectForm(formId));
  }, [dispatch, formId]);

  useEffect(() => {
    if (form) {
      (async () => {
        await dispatch(loadTopic({ resourceId: form.urn, typeId: 'form-questions' }));
        await dispatch(selectTopic({ resourceId: form.urn }));
      })();
    }
  }, [dispatch, definition, form]);

  useEffect(() => {
    if (form) {
      const urn = `urn:ads:platform:form-service:v1:/forms/${form.id}${
        form.submission?.id ? `/submissions/${form.submission?.id}` : ''
      }`;
      setFormUrn(urn);
    }
  }, [form]);

  return (
    <DetailsLayout
      initialized={!!(definition && form)}
      header={
        form && (
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
        )
      }
      nextTo={next && `../forms/${next}`}
    >
      <Tabs>
        <Tab heading="Form">
          <FormContainer>
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
                    type="secondary"
                    disabled={busy.executing}
                    onClick={() => dispatch(runFormOperation({ urn: AdspId.parse(form.urn), operation: 'to-draft' }))}
                  >
                    Set to draft
                  </GoabButton>
                )}
                {form?.status !== FormStatus.archived && canArchive && (
                  <GoabButton
                    type={form?.status === FormStatus.submitted ? 'primary' : 'secondary'}
                    disabled={busy.executing}
                    onClick={() => setShowArchiveConfirm(true)}
                  >
                    Archive form
                  </GoabButton>
                )}
              </GoabButtonGroup>
            </ActionsForm>
            <GoabModal heading="Archive this form?" open={showArchiveConfirm}>
              <div>
                Archiving the form will change its status to "Archived" so it can be separated from forms that are still
                being actively worked on. The applicant will no longer be able to update the form.
              </div>
              <GoabButtonGroup alignment="end" mt="xl">
                <GoabButton type="secondary" onClick={() => setShowArchiveConfirm(false)}>
                  Cancel
                </GoabButton>
                <GoabButton
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
          </FormContainer>
        </Tab>
        <Tab
          heading="Applicant questions"
          hide={!definition.supportTopic}
          icon={topic?.requiresAttention ? 'mail-unread' : null}
        >
          <CommentsViewer />
        </Tab>
      </Tabs>
    </DetailsLayout>
  );
};
