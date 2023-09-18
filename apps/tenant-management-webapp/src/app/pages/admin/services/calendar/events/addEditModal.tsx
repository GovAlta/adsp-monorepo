import React, { useEffect, useState } from 'react';
import { GoAModal, GoAFormItem } from '@abgov/react-components-new';
import { selectAddModalEvent } from '@store/calendar/selectors';
import { useSelector } from 'react-redux';

export const EventAddEditModal = (): JSX.Element => {
  const calendarEvent = useSelector(selectAddModalEvent);
  // eslint-disable-next-line
  useEffect(() => {}, [calendarEvent]);
  return <GoAModal open={calendarEvent !== null}></GoAModal>;
};
