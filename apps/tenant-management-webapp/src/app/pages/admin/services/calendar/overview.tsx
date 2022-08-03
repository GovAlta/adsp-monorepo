import React, { FunctionComponent } from 'react';

export const CalendarOverview: FunctionComponent = () => {
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
      </section>
    </div>
  );
};
