import React from 'react';

import styled from 'styled-components';

interface ServiceOptions {
  name: string;
  date: string;
  assignmentStatus?: string;
  state: string;
  description: string;
}

interface DescriptiveStrings {
  [key: string]: string;
}

function upcaseFirstLetterInEachWord(sentence: string) {
  const wordArray = sentence.split(' ');

  for (let i = 0; i < wordArray.length; i++) {
    wordArray[i] = wordArray[i].charAt(0).toUpperCase() + wordArray[i].slice(1);
  }

  return wordArray.join(' ');
}

export function ServiceStatus({ name, date, assignmentStatus = '', state, description }: ServiceOptions) {
  let stateProper = state.charAt(0).toUpperCase() + state.slice(1);
  stateProper = upcaseFirstLetterInEachWord(stateProper.replace('-', ' '));

  const backgroundColors: DescriptiveStrings = {
    Outage: '#ec0417',
    'Issues Reported': '#ec0417',
    'Reported Issues': '#ec0417',
    Maintenance: '#feba35',
    Pending: '#feba35',
    Disabled: '#feba35',
    Operational: '#00853f',
  };

  const textColor: DescriptiveStrings = {
    Outage: 'white',
    'Issues Reported': 'white',
    'Reported Issues': 'white',
    Maintenance: 'black',
    Pending: 'black',
    Disabled: 'black',
    Operational: 'white',
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
            <i>{date}</i>
          </div>
          <div className="flex">{description}</div>
        </div>
      </div>
    </ServiceStatusCss>
  );
}

export default ServiceStatus;

const ServiceStatusCss = styled.div`
  h4 {
    margin-top: '4px';
  }

  .grey-border {
    border: 1px solid #dcdcdc;
    border-radius: 3px;
    padding: 10px;
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
