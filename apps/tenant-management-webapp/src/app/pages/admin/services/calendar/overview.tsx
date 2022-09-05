import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoAButton } from '@abgov/react-components';
import { FetchRealmRoles } from '@store/tenant/actions';
interface CalendarOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const CalendarOverview = ({ setActiveEdit, setActiveIndex }: CalendarOverviewProps): JSX.Element => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchRealmRoles());
  }, []);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []);
  return (
    <div>
      <section>
        <p>
          The calendar service provides information about dates, a model of calendars, calendar events and scheduling.
          This service manages dates and times in a particular timezone (America/Edmonton) rather than UTC or a
          particular UTC offset. In practice this means that dates within daylight savings will use MDT offset whereas
          dates outside will use MST offset. Date time values sent into the API will be converted to the service
          timezone.
        </p>
        <GoAButton
          data-testid="add-calendar-btn"
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add calendar
        </GoAButton>
      </section>
    </div>
  );
};
