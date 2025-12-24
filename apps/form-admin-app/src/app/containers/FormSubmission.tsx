import {
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
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
} from '../state';
import { AdspId } from '../../lib/adspId';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { ActionsForm } from '../components/ActionsForm';
import { FormViewer } from './FormViewer';
import { PdfDownload } from './PdfDownload';
import { GoabDropdownOnChangeDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { submissionId } = useParams();
  const busy = useSelector(formBusySelector);
  const definition = useSelector(definitionSelector);
  const { submission, next } = useSelector(submissionSelector);
  const files = useSelector(submissionFilesSelector);

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

  return (
    <DetailsLayout
      initialized={!!(definition && submission)}
      navButtons={
        submission?.formId && (
          <GoabButton type="tertiary" onClick={() => navigate(`../forms/${submission.formId}`)}>
            Go to related form
          </GoabButton>
        )
      }
      nextTo={next && `../submissions/${next}`}
      header={
        submission && (
          <PropertiesContainer>
            <GoabFormItem mr="s" mb="s" label="Submitted by">
              {submission.createdBy.name}
            </GoabFormItem>
            <GoabFormItem mr="xl" mb="s" label="Submitted on">
              {DateTime.fromISO(submission.created).toFormat('LLL d, yyyy')}
            </GoabFormItem>
            <PdfDownload urn={formSubmissionUrn} />
          </PropertiesContainer>
        )
      }
      actionsForm={
        <ActionsForm>
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
                  value={draft.status || ''}
                  onChange={(detail: GoabDropdownOnChangeDetail) =>
                    dispatch(formActions.setDispositionDraft({ ...draft, status: detail.value }))
                  }
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
                />
              </GoabFormItem>
              <GoabButtonGroup alignment="end">
                <GoabButton
                  disabled={!draft.status || !draft.reason || busy.executing}
                  onClick={() =>
                    dispatch(
                      updateFormDisposition({
                        submissionUrn: `/forms/${submission.formId}${AdspId.parse(submission.urn).resource}`,
                        status: draft.status,
                        reason: draft.reason,
                      })
                    )
                  }
                >
                  Disposition
                </GoabButton>
              </GoabButtonGroup>
            </>
          )}
        </ActionsForm>
      }
    >
      <ContentContainer>
        <FormViewer
          dataSchema={definition?.dataSchema}
          uiSchema={definition?.uiSchema}
          data={submission?.formData}
          files={files}
        />
      </ContentContainer>
    </DetailsLayout>
  );
};
