import React from 'react';

import styled from 'styled-components';
import { GoACallout } from '@abgov/react-components';
import { Notice } from '@store/status/models';
import { LocalTime } from '@components/Date';
import '@abgov/core-css/src/lib/styles/v2/colors.scss';
interface ServiceOptions {
  name: string;
  date: string;
  state: string;
  description: string;
  notices: Notice[];
}

interface DescriptiveStrings {
  [key: string]: string;
}

function upcaseFirstLetterInEachWord(sentence: string) {
  const wordArray = sentence.split(' ');

  for (let i = 0; i < wordArray.length; i++) {
    wordArray[i] = wordArray[i]?.charAt(0).toUpperCase() + wordArray[i].slice(1);
  }

  return wordArray.join(' ');
}

export function ServiceStatus(props: ServiceOptions): JSX.Element {
  const { name, date, state, description, notices } = props;
  let stateProper = state?.charAt(0).toUpperCase() + state?.slice(1) || '';
  stateProper = upcaseFirstLetterInEachWord(stateProper.replace('-', ' '));

  const backgroundColors: DescriptiveStrings = {
    Outage: 'var(--color-red)',
    'Issues Reported': 'var(--color-red)',
    'Reported Issues': 'var(--color-red)',
    Maintenance: 'var(--color-orange)',
    Pending: 'var(--color-orange)',
    Disabled: 'var(--color-orange)',
    Operational: 'var(--color-green)',
  };

  const textColor: DescriptiveStrings = {
    Outage: 'var(--color-white)',
    'Issues Reported': 'var(--color-white)',
    'Reported Issues': 'var(--color-white)',
    Maintenance: 'var(--color-black)',
    Pending: 'var(--color-black)',
    Disabled: 'var(--color-black)',
    Operational: 'var(--color-black)',
  };

  const icons: DescriptiveStrings = {
    Outage: 'error',
    'Issues Reported': 'error',
    'Reported Issues': 'error',
    Maintenance: 'warning',
    Pending: 'warning',
    Disabled: 'warning',
    Operational: '',
  };

  return (
    <ServiceStatusCss>
      <div className="grey-border">
        <div className="flex-column">
          <div className="flex">
            <div className="flex-row">
              <div className="flex">
                <b>{name}</b>
              </div>
              <div className="align-right">
                <div
                  className="status-button"
                  style={{
                    backgroundColor: backgroundColors[stateProper],
                    color: textColor[stateProper],
                  }}
                >
                  <div className={`goa-${icons[stateProper]}`}>{stateProper}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="date-assignment-status">
            <i data-testid="service-created-date">{date}</i>
          </div>
          <div>{description}</div>
          {notices.map((notice) => {
            return (
              <div data-testid="service-notice">
                <GoACallout title="Notice" type="important" key={`{notice-${notice.id}}`}>
                  <div data-testid="service-notice-message">{notice.message}</div>
                  <br />
                  <div data-testid="service-notice-date-range">
                    From <LocalTime date={notice.startDate} /> to <LocalTime date={notice.endDate} />
                  </div>
                </GoACallout>
              </div>
            );
          })}
        </div>
      </div>
    </ServiceStatusCss>
  );
}

export default ServiceStatus;

const ServiceStatusCss = styled.div`
  .grey-border {
    border: 1px solid #eee2e2;
    border-radius: 3px;
    padding-top: 1.5rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-bottom: 2rem;
  }

  .status-button {
    padding: 0 6px;
    margin: 5px;
    font-size: 11px;
    border-radius: 4px;
  }

  .align-right {
    text-align: right;
  }

  .date-assignment-status {
    flex: 1;
    font-size: 15px;
    padding-bottom: 10px;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
  }

  .flex {
    flex: 1;
  }

  .flex-column {
    display: flex;
    flex-direction: column;
  }

  .goa-error {
    padding-left: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M11,9.41v4.52a1,1,0,0,0,2,0V9.41a1,1,0,0,0-2,0Z'/%3E%3Cpath fill='%23fff' d='M12,16.15a1.29,1.29,0,1,0,1.29,1.29A1.29,1.29,0,0,0,12,16.15Z'/%3E%3Cpath fill='%23fff' d='M22.87,20.14l-10-17.32a1,1,0,0,0-1.74,0l-10,17.32a1,1,0,0,0,0,1,1,1,0,0,0,.87.5H22a1,1,0,0,0,.87-.5A1,1,0,0,0,22.87,20.14Zm-19.14-.5L12,5.32l8.27,14.32Z'/%3E%3C/svg%3E");
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: 1px 6px;
    background-size: 16px 16px;
  }

  .goa-warning {
    padding-left: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z'/%3E%3Cpath fill='%23000' d='M12,14.46a1,1,0,0,0,1-1V6.57a1,1,0,0,0-2,0v6.89A1,1,0,0,0,12,14.46Z'/%3E%3Cpath fill='%23000' d='M12,15.68A1.29,1.29,0,1,0,13.29,17,1.29,1.29,0,0,0,12,15.68Z'/%3E%3C/svg%3E");
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: 1px 6px;
    background-size: 16px 16px;
  }
`;
