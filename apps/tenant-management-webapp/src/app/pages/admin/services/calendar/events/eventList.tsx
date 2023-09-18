import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventsByCalendar } from '@store/calendar/sagas';

interface EventListProps {
  calendarName: string;
}

export const EventList = ({ calendarName }: EventListProps): JSX.Element => {
  return <></>;
};
