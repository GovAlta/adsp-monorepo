import {
  GoabAccordion,
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabIcon,
  GoabTextArea,
} from '@abgov/react-components';
import { GoabDropdownOnChangeDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import {
  AppDispatch,
  definitionSelector,
  dispositionDraftSelector,
  formActions,
  formBusySelector,
  loadTopic,
  selectTopic,
  submissionSelector,
  topicSelector,
  updateFormDisposition,
  AppState,
  formSelector,
  selectForm,
} from '../state';
import { AdspId } from '../../lib/adspId';
import { DateTime } from 'luxon';
import { SubmissionNotes } from './SubmissionNotes';
import { Tags } from './Tags';
import { PropertiesContainer } from '../components/PropertiesContainer';
import styled from 'styled-components';
import { FunctionComponent, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CommentsViewer from './CommentsViewer';

const AccordionDisplayDiv = styled.main`
  display: block;
  padding: var(--goa-space-xl);
  overflow: auto;
`;

const ACCORDION_MAX_WIDTH = '1200px';

interface FormSubmissionWorkspaceProps {
  dispatch: AppDispatch;
  definition: ReturnType<typeof definitionSelector>;
  submission: ReturnType<typeof submissionSelector>['submission'];
  draft: ReturnType<typeof dispositionDraftSelector>;
  busy: ReturnType<typeof formBusySelector>;
  onOpenTag: () => void;
}

export const FormSubmissionWorkspace: FunctionComponent<FormSubmissionWorkspaceProps> = ({
  dispatch,
  definition,
  submission,
  draft,
  busy,
  onOpenTag,
}) => {
  const { form } = useSelector(formSelector);
  const topic = useSelector((state: AppState) => topicSelector(state, form?.urn));

  useEffect(() => {
    dispatch(selectForm(submission.formId));
  }, [dispatch, submission.formId]);

  useEffect(() => {
    if (form) {
      (async () => {
        await dispatch(loadTopic({ resourceId: form.urn, typeId: 'form-questions' }));
        await dispatch(selectTopic({ resourceId: form.urn }));
      })();
    }
  }, [dispatch, definition, form]);

  return (
    <AccordionDisplayDiv>
      {definition.supportTopic && (
        <GoabAccordion
          heading="Messages"
          maxWidth={ACCORDION_MAX_WIDTH}
          mb="m"
          headingContent={topic?.requiresAttention ? <GoabIcon type="mail-unread" /> : undefined}
        >
          <CommentsViewer />
        </GoabAccordion>
      )}
      <GoabAccordion heading="Notes" maxWidth={ACCORDION_MAX_WIDTH} mb="m">
        <SubmissionNotes dispatch={dispatch} submission={submission} busy={busy} />
      </GoabAccordion>
      <GoabAccordion heading="Tags" maxWidth={ACCORDION_MAX_WIDTH} mb="m">
        <Tags urn={submission.urn} hideAddButton={false} onTag={onOpenTag} />
      </GoabAccordion>
      <GoabAccordion heading="History" maxWidth={ACCORDION_MAX_WIDTH} mb="m">
        History section
        {/* TODO: Add History content */}
      </GoabAccordion>

      <GoabAccordion heading="Disposition" maxWidth={ACCORDION_MAX_WIDTH} mb="m">
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
    </AccordionDisplayDiv>
  );
};
