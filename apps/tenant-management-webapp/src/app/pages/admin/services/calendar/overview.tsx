import React, { useEffect } from 'react';

import { Overview } from '@components/Overview';

interface CalendarOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const CalendarOverview = ({ setActiveEdit, setActiveIndex }: CalendarOverviewProps): JSX.Element => {
  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventPage = urlParams.get('page') === 'events';

    if (eventPage) {
      setActiveIndex(2);
    }
  }, []);

  // setActiveEdit, setActiveIndex are props and when added as dependency to useEffect as it will always set to false hence add button will not work. So disabled esLint check
  const description = `The calendar service provides information about dates, a model of calendars, calendar events and scheduling. This service manages dates and times in a particular timezone (America/Edmonton) rather than UTC or a particular UTC offset. In practice this means that dates within daylight savings will use MDT offset whereas dates outside will use MST offset. Date time values sent into the API will be converted to the service timezone.`;

  const config = {
    addButton: {
      onClickCallback: () => {
        setActiveEdit(true);
      },
    },
    description: {
      content: description,
    },
  };

  return <Overview service="calendar" config={config} />;
};
