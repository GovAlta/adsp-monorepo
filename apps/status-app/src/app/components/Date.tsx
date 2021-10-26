
import React from 'react';

interface LocalTimeProps {
  date: string
}

export const LocalTime = (props: LocalTimeProps): JSX.Element => {
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric'
  } as Intl.DateTimeFormatOptions;

  const timeParts = new Date(props.date).toLocaleString('en-US', options).split(',');
  const localTime = `${timeParts[0]}, ${timeParts[1]}, ${timeParts[2]} at ${timeParts[3].toLowerCase()}`;
  return (<span>{localTime}</span>);
}