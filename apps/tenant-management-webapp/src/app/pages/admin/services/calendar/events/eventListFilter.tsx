import React, { useCallback, useEffect, useState } from 'react';
import { EventFilterWrapper } from './styled-components';
import { GoabGrid, GoabFormItem, GoabInput, GoabBadge } from '@abgov/react-components';
import { UpdateSearchCriteriaAndFetchEvents } from '@store/calendar/actions';
import { CalendarEventSearchCriteria } from '@store/calendar/models';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { CalendarEventFilterError, CalendarEventFilterErrorWrapper } from './styled-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface EventListFilterProps {
  calenderName?: string;
}

// Cleared or partially typed date inputs produce an invalid Date, and toISOString() throws on those.
const toISOStringOrUndefined = (value?: string): string | undefined => {
  const date = value ? new Date(value) : undefined;
  return date && !isNaN(date.getTime()) ? date.toISOString() : undefined;
};

const isSearchCriteriaValid = (criteria?: CalendarEventSearchCriteria) => {
  return new Date(criteria.startDate) < new Date(criteria.endDate);
};

export const EventListFilter = ({ calenderName }: EventListFilterProps): JSX.Element => {
  const criteria = useSelector((state: RootState) => state.calendarService?.eventSearchCriteria);
  const dispatch = useDispatch();
  const [showDateError, setShowDateError] = useState<boolean>(false);
  const [startDateValue, setStartDateValue] = useState(JSON.parse(JSON.stringify(criteria?.startDate)));
  const [endDateValue, setEndDateValue] = useState(JSON.parse(JSON.stringify(criteria?.endDate)));

  useEffect(() => {
    if (calenderName !== null) {
      setStartDateValue(JSON.parse(JSON.stringify(criteria.startDate)));
      setEndDateValue(JSON.parse(JSON.stringify(criteria.endDate)));
    }
  }, [calenderName, criteria.startDate, criteria.endDate]);

  const parsedStartDate = startDateValue && !isNaN(Date.parse(startDateValue)) ? new Date(startDateValue) : undefined;
  const parsedEndDate = endDateValue && !isNaN(Date.parse(endDateValue)) ? new Date(endDateValue) : undefined;

  const handleStartDateChange = useCallback(
    (value: string) => {
      const startDate = toISOStringOrUndefined(value);
      if (!startDate) {
        return;
      }

      if (!isSearchCriteriaValid({ ...criteria, startDate })) {
        setShowDateError(true);
      } else {
        setShowDateError(false);

        const updatedCriteria = {
          ...criteria,
          endDate: endDateValue,
          startDate,
          calendarName: calenderName,
        };

        setStartDateValue(updatedCriteria.startDate);
        dispatch(UpdateSearchCriteriaAndFetchEvents(updatedCriteria));
      }
    },
    [criteria, endDateValue, calenderName, dispatch],
  );

  const handleEndDateChange = useCallback(
    (value: string) => {
      const endDate = toISOStringOrUndefined(value);
      if (!endDate) {
        return;
      }

      if (!isSearchCriteriaValid({ ...criteria, startDate: startDateValue, endDate })) {
        setShowDateError(true);
      } else {
        setShowDateError(false);

        const updatedCriteria = {
          ...criteria,
          startDate: startDateValue,
          endDate,
          calendarName: calenderName,
        };
        setEndDateValue(updatedCriteria.endDate);
        dispatch(UpdateSearchCriteriaAndFetchEvents(updatedCriteria));
      }
    },
    [criteria, startDateValue, calenderName, dispatch],
  );

  return (
    <EventFilterWrapper>
      <GoabGrid minChildWidth="20ch">
        <GoabFormItem label="Start date">
          <GoabInput
            size="compact"
            type="date"
            name="calendar-event-filter-start-date"
            value={calenderName && parsedStartDate?.toISOString().slice(0, 10)}
            disabled={calenderName === null}
            onChange={(detail: GoabInputOnChangeDetail) => handleStartDateChange(detail.value)}
          />
        </GoabFormItem>

        <GoabFormItem label="End date">
          <GoabInput
            size="compact"
            type="date"
            name="calendar-event-filter-end-date"
            value={calenderName && parsedEndDate?.toISOString().slice(0, 10)}
            disabled={calenderName === null}
            onChange={(detail: GoabInputOnChangeDetail) => handleEndDateChange(detail.value)}
          />
        </GoabFormItem>
      </GoabGrid>
      {showDateError && (
        <CalendarEventFilterErrorWrapper>
          <GoabBadge type="emergency" icon />
          <CalendarEventFilterError>Start date must be before end date.</CalendarEventFilterError>
        </CalendarEventFilterErrorWrapper>
      )}
    </EventFilterWrapper>
  );
};
