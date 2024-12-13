import {
  GoAButton,
  GoAButtonGroup,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoATextArea,
} from '@abgov/react-components-new';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { AppDispatch, definitionSelector, selectSubmission, submissionSelector, updateFormDisposition } from '../state';
import { FormViewer } from '../components/FormViewer';
import { ContentContainer } from '../components/ContentContainer';
import { DetailsLayout } from '../components/DetailsLayout';
import { AdspId } from '../../lib/adspId';

export const FormSubmission = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { submissionId } = useParams();
  const definition = useSelector(definitionSelector);
  const submission = useSelector(submissionSelector);

  const [draft, setDraft] = useState({ selectedDisposition: '', reason: '' });

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
                  value={draft.selectedDisposition}
                  onChange={(_, selectedDisposition: string) => setDraft({ ...draft, selectedDisposition })}
                  relative={true}
                >
                  {definition?.dispositionStates?.map((state) => (
                    <GoADropdownItem key={state.id} value={state.name} />
                  ))}
                </GoADropdown>
              </GoAFormItem>
              <GoAFormItem label="Reason">
                <GoATextArea name="reason" value={draft.reason} onChange={(reason) => setDraft({ ...draft, reason })} />
              </GoAFormItem>
              <GoAButtonGroup alignment="end">
                <GoAButton
                  disabled={!draft.selectedDisposition || !draft.reason}
                  onClick={() =>
                    dispatch(
                      updateFormDisposition({
                        submissionUrn: AdspId.parse(submission.urn),
                        status: draft.selectedDisposition,
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
