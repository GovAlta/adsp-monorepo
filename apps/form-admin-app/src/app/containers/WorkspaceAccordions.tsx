import {
  GoabAccordion,
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabTextArea,
} from '@abgov/react-components';
import { GoabDropdownOnChangeDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import {
  AppDispatch,
  definitionSelector,
  dispositionDraftSelector,
  formActions,
  formBusySelector,
  submissionSelector,
  updateFormDisposition,
} from '../state';
import { AdspId } from '@core-services/app-common';
import { DateTime } from 'luxon';
import { Tags } from './Tags';
import { PropertiesContainer } from '../components/PropertiesContainer';
import styled from 'styled-components';
import { FunctionComponent } from 'react';

const AccordianDisplayDiv = styled.main`
  display: block;
  padding: var(--goa-space-xl);
  overflow: auto;
`;

const ACCORDIAN_MAX_WIDTH = '1200px';

interface WorkspaceAccordionsProps {
  dispatch: AppDispatch;
  definition: ReturnType<typeof definitionSelector>;
  submission: ReturnType<typeof submissionSelector>['submission'];
  draft: ReturnType<typeof dispositionDraftSelector>;
  busy: ReturnType<typeof formBusySelector>;
  onOpenTag: () => void;
}

// Hoisted to module scope so its identity is stable across FormSubmission renders and React can diff instead of remounting.
export const WorkspaceAccordions: FunctionComponent<WorkspaceAccordionsProps> = ({
  dispatch,
  definition,
  submission,
  draft,
  busy,
  onOpenTag,
}) => {
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
