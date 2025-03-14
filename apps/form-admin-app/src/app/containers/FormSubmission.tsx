import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATextArea,
} from '@abgov/react-components';
import { DateTime } from 'luxon';
import { useEffect } from 'react';
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

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { submissionId } = useParams();
  const busy = useSelector(formBusySelector);
  const definition = useSelector(definitionSelector);
  const { submission, next } = useSelector(submissionSelector);
  const files = useSelector(submissionFilesSelector);
  const draft = useSelector(dispositionDraftSelector);

  useEffect(() => {
    dispatch(selectSubmission(submissionId));
  }, [dispatch, submissionId]);

  return (
    <DetailsLayout
      initialized={!!(definition && submission)}
      navButtons={
        submission?.formId && (
          <GoAButton type="tertiary" onClick={() => navigate(`../forms/${submission.formId}`)}>
            Go to related form
          </GoAButton>
        )
      }
      nextTo={next && `../submissions/${next}`}
      header={
        submission && (
          <PropertiesContainer>
            <GoAFormItem mr="s" mb="s" label="Submitted by">
              {submission.createdBy.name}
            </GoAFormItem>
            <GoAFormItem mr="xl" mb="s" label="Submitted on">
              {DateTime.fromISO(submission.created).toFormat('LLL d, yyyy')}
            </GoAFormItem>
            <PdfDownload urn={submission.urn} />
          </PropertiesContainer>
        )
      }
      actionsForm={
        <ActionsForm>
          {submission?.disposition ? (
            <PropertiesContainer>
              <GoAFormItem ml="xl" label="Disposition">
                <span>{submission.disposition.status}</span>
              </GoAFormItem>
              <GoAFormItem ml="xl" label="Reason">
                <span>{submission.disposition.reason}</span>
              </GoAFormItem>
              <GoAFormItem ml="xl" label="Dispositioned on">
                <span>{DateTime.fromISO(submission.disposition.date).toFormat('LLL d, yyyy')}</span>
              </GoAFormItem>
            </PropertiesContainer>
          ) : (
            <>
              <GoAFormItem label="Disposition">
                <GoADropdown
                  value={draft.status || ''}
                  onChange={(_, status: string) => dispatch(formActions.setDispositionDraft({ ...draft, status }))}
                  relative={true}
                >
                  <GoADropdownItem value={''} label={'None selected'} />
                  {definition?.dispositionStates?.map((state) => (
                    <GoADropdownItem key={state.id} value={state.name} label={state.name} />
                  ))}
                </GoADropdown>
              </GoAFormItem>
              <GoAFormItem label="Reason">
                <GoATextArea
                  name="reason"
                  value={draft.reason}
                  onChange={(_, reason) => dispatch(formActions.setDispositionDraft({ ...draft, reason }))}
                />
              </GoAFormItem>
              <GoAButtonGroup alignment="end">
                <GoAButton
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
                </GoAButton>
              </GoAButtonGroup>
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
