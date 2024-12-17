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
  submissionSelector,
  updateFormDisposition,
} from '../state';
import { FormViewer } from '../components/FormViewer';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { AdspId } from '../../lib/adspId';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { submissionId } = useParams();
  const busy = useSelector(busySelector);
  const definition = useSelector(definitionSelector);
  const submission = useSelector(submissionSelector);
  const draft = useSelector(dispositionDraftSelector);

  useEffect(() => {
    dispatch(selectSubmission(submissionId));
  }, [dispatch, submissionId]);

  return (
    <DetailsLayout
      initialized={!!(definition && submission)}
      actionsForm={
        <form>
          {submission?.disposition ? (
            <>
              <GoAFormItem label="Disposition">
                <span>{submission.disposition.status}</span>
              </GoAFormItem>
              <GoAFormItem label="Reason">
                <span>{submission.disposition.reason}</span>
              </GoAFormItem>
              <GoAFormItem label="Dispositioned on">
                <span>{DateTime.fromISO(submission.disposition.date).toFormat('LLL dd, yyyy')}</span>
              </GoAFormItem>
            </>
          ) : (
            <>
              <GoAFormItem label="Disposition">
                <GoADropdown
                  value={draft.status || ''}
                  onChange={(_, status: string) => dispatch(formActions.setDispositionDraft({ ...draft, status }))}
                  relative={true}
                >
                    <GoADropdownItem value={''} label={"None selected"} />
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
            </>
          )}
        </form>
      }
    >
      <ContentContainer>
        <FormViewer dataSchema={definition?.dataSchema} uiSchema={definition?.uiSchema} data={submission?.formData} />
      </ContentContainer>
    </DetailsLayout>
  );
};
