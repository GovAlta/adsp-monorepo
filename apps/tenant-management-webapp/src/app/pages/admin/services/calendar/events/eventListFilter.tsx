import React, { useEffect, useState } from 'react';
import { EventFilterWrapper } from './styled-components';
import { GoAGrid, GoAFormItem, GoAInputDate, GoABadge } from '@abgov/react-components-new';
import { UpdateSearchCriteriaAndFetchEvents } from '@store/calendar/actions';
import { CalendarEventSearchCriteria } from '@store/calendar/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CalendarEventFilterError } from './styled-components';

interface EventListFilterProps {
  calenderName?: string;
}

const isSearchCriteriaValid = (criteria?: CalendarEventSearchCriteria) => {
  return new Date(criteria.startDate) < new Date(criteria.endDate);
};

export const EventListFilter = ({ calenderName }: EventListFilterProps): JSX.Element => {
  const criteria = useSelector((state: RootState) => state.calendarService?.eventSearchCriteria);
  const todayDate = new Date();
  const futureDate = new Date(todayDate);
  futureDate.setDate(todayDate.getDate() + 7);
  criteria.startDate = todayDate.toISOString();
  criteria.endDate = futureDate.toISOString();
  criteria.calendarName = calenderName;

  const dispatch = useDispatch();
  const [showDateError, setShowDateError] = useState<boolean>(false);
  const [startDateValue, setStartDateValue] = useState(criteria.startDate);
  const [endDateValue, setEndDateValue] = useState(criteria.endDate);

  useEffect(()=>{
    if(calenderName !== null){
      setStartDateValue(criteria.startDate);
      setEndDateValue(criteria.endDate);
    }
  },[calenderName])

  return (
    <EventFilterWrapper>
      <GoAGrid minChildWidth="20ch">
        <GoAFormItem label="Start date">
          <GoAInputDate
            name="calendar-event-filter-start-date"
            value={calenderName ? startDateValue : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);
                criteria.endDate = endDateValue;
                criteria.startDate = new Date(value).toISOString();
                setStartDateValue(criteria.startDate);
                dispatch(UpdateSearchCriteriaAndFetchEvents(criteria));
              }
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End date">
          <GoAInputDate
            name="calendar-event-filter-end-date"
            value={calenderName ? endDateValue : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);
                criteria.startDate = startDateValue;
                criteria.endDate = new Date(value).toISOString();
                setEndDateValue(criteria.endDate);
                dispatch(UpdateSearchCriteriaAndFetchEvents(criteria));
              }
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
    </EventFilterWrapper>
  );
};
