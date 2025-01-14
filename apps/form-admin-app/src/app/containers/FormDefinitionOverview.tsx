import {
  GoABadge,
  GoAButton,
  GoAButtonGroup,
  GoACheckbox,
  GoAContainer,
  GoADetails,
  GoAFormItem,
  GoAIconButton,
  GoASpacer,
  GoATable,
} from '@abgov/react-components-new';
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
import { RowSkeleton } from '../components/RowSkeleton';

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
        <GoAContainer mt="m">
          <PropertiesContainer>
            <GoAFormItem label="ID" mr="m">
              <span>{definition.id}</span>
            </GoAFormItem>
            <GoAFormItem label="Name" mr="m">
              <span>{definition.name}</span>
            </GoAFormItem>
            <GoAFormItem label="Description" mr="m">
              <span>{definition.description}</span>
            </GoAFormItem>
          </PropertiesContainer>
        </GoAContainer>
        <h3>General</h3>
        <GoASpacer vSpacing="m" />
        {definition.anonymousApply ? (
          <GoADetails heading="Anonymous applicants">
            Applicants can create and submit forms without signing in. This can reduce the quality of submissions, and
            users may resubmit the same information more than once.
          </GoADetails>
        ) : (
          <GoADetails heading="Signed in applicants">
            Applicants must sign in to create and submit forms. The user applying can start and resume from a draft of
            the form, then submit once ready.
          </GoADetails>
        )}
        {definition.generatesPdf ? (
          <GoADetails heading="Creates PDF when submitted">
            PDF copy of the submitted information is created when forms are submitted.
          </GoADetails>
        ) : (
          <GoADetails heading="No PDF is created">PDF copy is not created when forms are submitted.</GoADetails>
        )}
        {definition.submissionRecords ? (
          <GoADetails heading="Creates submission records">
            Submission records are created when forms are submitted. The submission captures the information in the form
            when it is submitted for processing, and it can be dispositioned to record a decision.
          </GoADetails>
        ) : (
          <GoADetails heading="No submission records">
            Submission records are not created when forms are submitted. The form status indicates if it has been
            submitted. Any follow-up actions such as service fulfillment or client onboarding need to be handled outside
            the form system.
          </GoADetails>
        )}
        {definition?.scheduledIntakes && (
          <>
            <h3>Intake scheduling</h3>
            <p>
              This form is configured for scheduled intakes. Applicants will only be able to create and submit forms
              during periods of active intake scheduled on a calendar.
            </p>
            <GoATable width="100%">
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
                        <GoABadge type="success" content={definition.intake.isUpcoming ? 'Upcoming' : 'Active'} />
                      )}
                    </td>
                    <td>{event.start.toFormat('LLLL dd ttt')}</td>
                    <td>{event.end.toFormat('LLLL dd ttt')}</td>
                    <td>
                      <GoAIconButton icon="trash" onClick={() => dispatch(deleteEvent(event.urn))} />
                    </td>
                  </tr>
                ))}
                <RowSkeleton show={calendarBusy.loading} columns={4} />
              </tbody>
            </GoATable>
            <form>
              <GoAButtonGroup alignment="end" mt="l">
                <GoAButton type="secondary" onClick={() => setShowScheduleIntake(true)}>
                  Schedule intake
                </GoAButton>
              </GoAButtonGroup>
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
        <GoATable width="100%" mt="m">
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
                  <GoACheckbox
                    name="Show column"
                    mt="s"
                    checked={!!selected}
                    onChange={(_, selected) =>
                      dispatch(updateDataValue({ definitionId: definition.id, path, selected }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </GoATable>
      </ContentContainer>
    </OverviewLayout>
  );
};
