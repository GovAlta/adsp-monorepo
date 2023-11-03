import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { CalendarOverview } from './overview';
import { CalendarsView } from './calendar/calendarsView';
import React, { useState } from 'react';

import BetaBadge from '@icons/beta-badge.svg';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { HeadingDiv } from './styled-components';
import AsideLinks from '@components/AsideLinks';
import { CalendarEvents } from './events';

export const Calendar = (): JSX.Element => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activateEditState, setActivateEditState] = useState<boolean>(false);

  const activateEdit = (edit: boolean) => {
    setActiveIndex(1);
    setActivateEditState(edit);
  };
  const getCalenderDocsLink = () => {
    return `${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}?urls.primaryName=Calendar service`;
  };
  const getCalenderSupportCodeLink = () => {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/calendar-service';
  };
  return (
    <Page>
      <Main>
        <>
          <HeadingDiv>
            <h1 data-testid="calendar-title">Calendar service</h1>
            <img src={BetaBadge} alt="Files Service" />
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
        <AsideLinks serviceLink={getCalenderSupportCodeLink()} docsLink={getCalenderDocsLink()} />
      </Aside>
    </Page>
  );
};
