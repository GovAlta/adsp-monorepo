import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATextArea,
} from '@abgov/react-components-new';
import { DateTime } from 'luxon';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  AppDispatch,
  busySelector,
  definitionSelector,
  dispositionDraftSelector,
  formActions,
  selectSubmission,
  submissionFilesSelector,
  submissionSelector,
  updateFormDisposition,
} from '../state';
import { FormViewer } from './FormViewer';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { AdspId } from '../../lib/adspId';
import { PdfDownload } from './PdfDownload';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { submissionId } = useParams();
  const busy = useSelector(busySelector);
  const definition = useSelector(definitionSelector);
  const submission = useSelector(submissionSelector);
  const files = useSelector(submissionFilesSelector);
  const draft = useSelector(dispositionDraftSelector);

  useEffect(() => {
    dispatch(selectSubmission(submissionId));
  }, [dispatch, submissionId]);

  return (
    <DetailsLayout
      initialized={!!(definition && submission)}
      header={
        submission && (
          <PropertiesContainer>
            <GoAFormItem mr="s" mb="s" label="Submitted by">
              {submission.createdBy.name}
            </GoAFormItem>
            <GoAFormItem mr="xl" mb="s" label="Submitted on">
              {DateTime.fromISO(submission.created).toFormat('LLL dd, yyyy')}
            </GoAFormItem>
            <PdfDownload urn={submission.urn} />
          </PropertiesContainer>
        )
      }
      actionsForm={
        submission?.disposition ? (
          <PropertiesContainer>
            <GoAFormItem ml="xl" label="Disposition">
              <span>{submission.disposition.status}</span>
            </GoAFormItem>
            <GoAFormItem ml="xl" label="Reason">
              <span>{submission.disposition.reason}</span>
            </GoAFormItem>
            <GoAFormItem ml="xl" label="Dispositioned on">
              <span>{DateTime.fromISO(submission.disposition.date).toFormat('LLL dd, yyyy')}</span>
            </GoAFormItem>
          </PropertiesContainer>
        ) : (
          <form>
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
                      submissionUrn: AdspId.parse(submission.urn),
                      status: draft.status,
                      reason: draft.reason,
                    })
                  )
                }
              >
                Disposition
              </GoAButton>
            </GoAButtonGroup>
          </form>
        )
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
