import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { CalendarOverview } from './overview';
import { CalendarsView } from './calendar/calendarsView';
import React, { useState } from 'react';

import BetaBadge from '@icons/beta-badge.svg';
import { HeadingDiv } from '../styled-components';
import AsideLinks from '@components/AsideLinks';
import { CalendarEvents } from './events';

export const Calendar = (): JSX.Element => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };

  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="calendar-title">Calendar service</h1>
            <img src={BetaBadge} alt="Calendar Service" />
          </HeadingDiv>

          <Tabs activeIndex={activeIndex} data-testid="calendar-tabs">
            <Tab label="Overview" data-testid="calendar-overview-tab">
              <CalendarOverview setActiveIndex={setActiveIndex} setActiveEdit={activateEdit} />
            </Tab>
            <Tab label="Calendars" data-testid="calendars-tab">
              <CalendarsView activeEdit={activateEditState} />
            </Tab>
            <Tab label="Events" data-testid="calendar-event-tab">
              <CalendarEvents />
            </Tab>
          </Tabs>
        </>
      </Main>
      <Aside>
        <AsideLinks serviceName={'calendar'} />
      </Aside>
    </Page>
  );
};
