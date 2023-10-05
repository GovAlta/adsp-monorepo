import React, { useState } from 'react';
import { EventFilterWrapper, EventFilterButtonWrapper } from './styled-components';
import { GoAGrid, GoAFormItem, GoAInputDate, GoAButton, GoABadge } from '@abgov/react-components-new';
import { UpdateSearchCalendarEventCriteria, FetchEventsByCalendar } from '@store/calendar/actions';
import { CalendarEventSearchCriteria } from '@store/calendar/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CalendarEventFilterError } from './styled-components';

interface EventListFilterProps {
  calenderName: string;
}

const isSearchCriteriaValid = (criteria: CalendarEventSearchCriteria) => {
  return new Date(criteria.startDate) < new Date(criteria.endDate);
};

export const EventListFilter = ({ calenderName }: EventListFilterProps): JSX.Element => {
  const criteria = useSelector((state: RootState) => state.calendarService?.eventSearchCriteria);
  const dispatch = useDispatch();
  const [showDateError, setShowDateError] = useState<boolean>(false);

  return (
    <EventFilterWrapper>
      <GoAGrid minChildWidth="30ch" gap="xs">
        <GoAFormItem label="Start date after">
          <GoAInputDate
            name="calendar-event-filter-start-date"
            value={criteria.startDate}
            onChange={(name, value) => {
              criteria.startDate = new Date(value).toISOString();
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
                return;
              }
              setShowDateError(false);
              dispatch(UpdateSearchCalendarEventCriteria(criteria));
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End date before">
          <GoAInputDate
            name="calendar-event-filter-end-date"
            value={criteria.endDate}
            onChange={(name, value) => {
              criteria.endDate = new Date(value).toISOString();
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
                return;
              }
              setShowDateError(false);
              dispatch(UpdateSearchCalendarEventCriteria(criteria));
            }}
          />
        </GoAFormItem>
      </GoAGrid>
      {showDateError && (
        <>
          <GoABadge type="emergency" icon />
          <CalendarEventFilterError>
            Start after timestamp shall be after the end before timestamp.
          </CalendarEventFilterError>
        </>
      )}
      <GoAFormItem label="">
        <EventFilterButtonWrapper>
          <GoAButton
            type="secondary"
            testId="calendar-event-filter-submit-btn"
            disabled={showDateError}
            onClick={() => {
              dispatch(FetchEventsByCalendar(calenderName, null));
            }}
          >
            Show event
          </GoAButton>
        </EventFilterButtonWrapper>
      </GoAFormItem>
    </EventFilterWrapper>
  );
};
