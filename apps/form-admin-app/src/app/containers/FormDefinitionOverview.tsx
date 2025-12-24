import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCheckbox,
  GoabContainer,
  GoabDetails,
  GoabFormItem,
  GoabIconButton,
  GoabSpacer,
  GoabTable,
} from '@abgov/react-components';
import { RowSkeleton } from '@core-services/app-common';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  AppDispatch,
  AppState,
  calendarBusySelector,
  canGetIntakeCalendarSelector,
  createEvent,
  dataValuesSelector,
  definitionSelector,
  deleteEvent,
  getEvents,
  recordEventsSelector,
  updateDataValue,
} from '../state';
import { ContentContainer } from '../components/ContentContainer';
import { PropertiesContainer } from '../components/PropertiesContainer';
import { ScheduleIntakeModal } from '../components/ScheduleIntakeModal';
import { GoabCheckboxOnChangeDetail } from '@abgov/ui-components-common';

const OverviewLayout = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
`;

interface FormDefinitionOverviewProps {
  definitionId: string;
}

export const FormDefinitionOverview: FunctionComponent<FormDefinitionOverviewProps> = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [showScheduleIntake, setShowScheduleIntake] = useState(false);

  const canGetIntakeCalendar = useSelector(canGetIntakeCalendarSelector);
  const definition = useSelector(definitionSelector);
  const dataValues = useSelector(dataValuesSelector);

  const calendarBusy = useSelector(calendarBusySelector);
  const intakeEvents = useSelector((state: AppState) => recordEventsSelector(state, definition.urn));

  useEffect(() => {
    if (definition.scheduledIntakes && canGetIntakeCalendar) {
      const now = new Date().toISOString();
      dispatch(
        getEvents({
          calendar: 'form-intake',
          criteria: {
            recordId: definition.urn,
            activeOn: now,
          },
        })
      );

      dispatch(
        getEvents({
          calendar: 'form-intake',
          criteria: {
            recordId: definition.urn,
            startsAfter: now,
          },
        })
      );
    }
  }, [dispatch, canGetIntakeCalendar, definition]);

  return (
    <OverviewLayout>
      <ContentContainer>
        <h2>Overview</h2>
        <GoabContainer mt="m">
          <PropertiesContainer>
            <GoabFormItem label="ID" mr="m">
              <span>{definition.id}</span>
            </GoabFormItem>
            <GoabFormItem label="Rev" mr="m">
              <span>{definition.revision}</span>
            </GoabFormItem>
            <GoabFormItem label="Name" mr="m">
              <span>{definition.name}</span>
            </GoabFormItem>
            <GoabFormItem label="Description" mr="m">
              <span>{definition.description}</span>
            </GoabFormItem>
          </PropertiesContainer>
        </GoabContainer>
        <h3>General</h3>
        <GoabSpacer vSpacing="m" />
        {definition.anonymousApply ? (
          <GoabDetails heading="Anonymous applicants">
            Applicants can create and submit forms without signing in. This can reduce the quality of submissions, and
            users may resubmit the same information more than once.
          </GoabDetails>
        ) : (
          <GoabDetails heading="Signed in applicants">
            Applicants must sign in to create and submit forms. The user applying can start and resume from a draft of
            the form, then submit once ready.
          </GoabDetails>
        )}
        {!definition.anonymousApply &&
          (definition.oneFormPerApplicant ? (
            <GoabDetails heading="One form per applicant">
              Applicants can create one form of this definition. In programs where people are expected to apply only
              once, this configuration limits the the opportunity for duplicate submissions. However, programs should
              still consider duplicates since this configuration cannot fully prevent them (for example, if both parents
              apply for the same dependent child).
            </GoabDetails>
          ) : (
            <GoabDetails heading="Multiple forms per applicant">
              Applicants can create multiple forms of this definition. In programs where people can make multiple
              distinct submissions, such as separate submissions for family members, this configuration allows them to
              create, draft and submit the forms separately.
            </GoabDetails>
          ))}
        {definition.supportTopic ? (
          <GoabDetails heading="Applicant questions">
            Applicants can send questions regarding their form, which staff can review and respond to. Anonymous
            applicants are not able to send questions.
          </GoabDetails>
        ) : (
          <GoabDetails heading="No applicant questions">
            Applicants are not able to send questions through the form system.
          </GoabDetails>
        )}
        {definition.generatesPdf ? (
          <GoabDetails heading="Creates PDF when submitted">
            PDF copy of the submitted information is created when forms are submitted.
          </GoabDetails>
        ) : (
          <GoabDetails heading="No PDF is created">PDF copy is not created when forms are submitted.</GoabDetails>
        )}
        {definition.submissionRecords ? (
          <GoabDetails heading="Creates submission records">
            Submission records are created when forms are submitted. The submission captures the information in the form
            when it is submitted for processing, and it can be dispositioned to record a decision.
          </GoabDetails>
        ) : (
          <GoabDetails heading="No submission records">
            Submission records are not created when forms are submitted. The form status indicates if it has been
            submitted. Any follow-up actions such as service fulfillment or client onboarding need to be handled outside
            the form system.
          </GoabDetails>
        )}
        {definition?.scheduledIntakes && (
          <>
            <h3>Intake scheduling</h3>
            <p>
              This form is configured for scheduled intakes. Applicants will only be able to create and submit forms
              during periods of active intake scheduled on a calendar.
            </p>
            <GoabTable width="100%">
              <thead>
                <tr>
                  <th></th>
                  <th>Starts on</th>
                  <th>Ends on</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {intakeEvents.map((event) => (
                  <tr key={event.urn}>
                    <td>
                      {definition.intake?.urn === event.urn && (
                        <GoabBadge
                          type="success"
                          content={definition.intake.isUpcoming ? 'Upcoming' : 'Active'}
                          icon={false}
                        />
                      )}
                    </td>
                    <td>{event.start.toFormat('LLL d, yyyy ttt')}</td>
                    <td>{event.end.toFormat('LLL d, yyyy ttt')}</td>
                    <td>
                      <GoabIconButton
                        title="trash button"
                        icon="trash"
                        onClick={() => dispatch(deleteEvent(event.urn))}
                      />
                    </td>
                  </tr>
                ))}
                <RowSkeleton show={calendarBusy.loading} columns={4} />
              </tbody>
            </GoabTable>
            <form>
              <GoabButtonGroup alignment="end" mt="l">
                <GoabButton type="secondary" onClick={() => setShowScheduleIntake(true)}>
                  Schedule intake
                </GoabButton>
              </GoabButtonGroup>
              <ScheduleIntakeModal
                open={showScheduleIntake}
                onClose={() => setShowScheduleIntake(false)}
                onSchedule={async (start, end) => {
                  await dispatch(
                    createEvent({
                      recordId: definition.urn,
                      start,
                      end,
                      name: `Intake for ${definition.name}`,
                      description:
                        `Open intake event for ${definition.name} (ID: ${definition.id}). ` +
                        `During this event, applicants can create and submit the ${definition.name} form`,
                    })
                  );
                  setShowScheduleIntake(false);
                }}
              />
            </form>
          </>
        )}
        <h3>Data value columns</h3>
        <p>
          Select the form data values to show as columns so that forms and submissions are easier to view at a glance.
          The preferences shown here are saved and shared between users accessing this application from this
          workstation.
        </p>
        <GoabTable width="100%" mt="m">
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th>Show column</th>
            </tr>
          </thead>
          <tbody>
            {dataValues.map(({ name, path, selected }) => (
              <tr key={path}>
                <td>{name}</td>
                <td>{path}</td>
                <td>
                  <GoabCheckbox
                    name="Show column"
                    mt="s"
                    checked={!!selected}
                    onChange={(detail: GoabCheckboxOnChangeDetail) =>
                      dispatch(updateDataValue({ definitionId: definition.id, path, selected: detail?.checked }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </GoabTable>
      </ContentContainer>
    </OverviewLayout>
  );
};
