import React, { useEffect, useState } from 'react';
import { EventFilterWrapper } from './styled-components';
import { GoAGrid, GoAFormItem, GoAInputDate, GoABadge } from '@abgov/react-components';
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

  const dispatch = useDispatch();
  const [showDateError, setShowDateError] = useState<boolean>(false);
  const [startDateValue, setStartDateValue] = useState(JSON.parse(JSON.stringify(criteria?.startDate)));
  const [endDateValue, setEndDateValue] = useState(JSON.parse(JSON.stringify(criteria?.endDate)));

  useEffect(() => {
    if (calenderName !== null) {
      setStartDateValue(JSON.parse(JSON.stringify(criteria.startDate)));
      setEndDateValue(JSON.parse(JSON.stringify(criteria.endDate)));
    }
  }, [calenderName]);

  const parsedStartDate = startDateValue && !isNaN(Date.parse(startDateValue)) ? new Date(startDateValue) : undefined;
  const parsedEndDate = endDateValue && !isNaN(Date.parse(endDateValue)) ? new Date(endDateValue) : undefined;

  return (
    <EventFilterWrapper>
      <GoAGrid minChildWidth="20ch">
        <GoAFormItem label="Start date">
          <GoAInputDate
            name="calendar-event-filter-start-date"
            value={calenderName ? parsedStartDate : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              criteria.startDate = new Date(value).toISOString();
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);

                const updatedCriteria = {
                  ...criteria,
                  endDate: endDateValue,
                  startDate: new Date(value).toISOString(),
                  calendarName: calenderName,
                };

                setStartDateValue(updatedCriteria.startDate);
                dispatch(UpdateSearchCriteriaAndFetchEvents(updatedCriteria));
              }
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End date">
          <GoAInputDate
            name="calendar-event-filter-end-date"
            value={calenderName ? parsedEndDate : null}
            disabled={calenderName === null}
            onChange={(name, value) => {
              if (!isSearchCriteriaValid(criteria)) {
                setShowDateError(true);
              } else {
                setShowDateError(false);

                const updatedCriteria = {
                  ...criteria,
                  startDate: startDateValue,
                  endDate: new Date(value).toISOString(),
                  calendarName: calenderName,
                };
                setEndDateValue(updatedCriteria.endDate);
                dispatch(UpdateSearchCriteriaAndFetchEvents(updatedCriteria));
              }
            }}
          />
        </GoAFormItem>
      </GoAGrid>
      {showDateError && (
        <>
          <GoABadge type="emergency" icon />
          <CalendarEventFilterError>Start date must be before end date.</CalendarEventFilterError>
        </>
      )}
    </EventFilterWrapper>
  );
};
