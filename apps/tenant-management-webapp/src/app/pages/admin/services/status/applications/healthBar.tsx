import { CSSProperties } from 'styled-components';
import moment from 'moment';
import React from 'react';
import { StatusBarDetails, EndpointStatusEntries, EndpointStatusTick } from './styled-components';
import { StatusBar } from './StatusBar';
import { ApplicationStatus, ServiceStatusEndpoint, EndpointStatusEntry } from '@store/status/models';

interface AppEndpointProps {
  app: ApplicationStatus;
  displayCount: number;
}

// Display count normally set to 30
export const HealthBar = ({ app, displayCount }: AppEndpointProps): JSX.Element => {
  const css: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
  };

  function getTimestamp(timestamp: number): string {
    const d = new Date(timestamp);
    const hours = d.getHours();
    const minutes = d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes();
    return `${hours > 12 ? hours - 12 : hours}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  }

  const millisecondsPerMinute = 60 * 1000;

  /**
   * Generate a list of health checks for the given endpoint and fills in the blank time slots with empty entries.
   * @param endpoint The service endpoint
   * @returns
   */
  function getStatusEntries(endpoint: ServiceStatusEndpoint): EndpointStatusEntry[] {
    // Get the last "displayCount" entries (one is generated per minute)
    const t0 = Date.now() - displayCount * millisecondsPerMinute;
    const timePeriodEntries =
      endpoint.statusEntries?.filter((entry) => entry.timestamp > t0).sort((a, b) => a.timestamp - b.timestamp) || [];

    const statusBar = new StatusBar(endpoint, timePeriodEntries);
    return statusBar.getEntries();
  }

  const statusEntries = app.endpoint ? getStatusEntries(app.endpoint) : null;
  const getStatus = (app: ApplicationStatus): string => {
    if (!app.enabled) {
      return 'stopped';
    }

    return app.internalStatus;
  };

  const status = getStatus(app);

  return (
    <div style={css}>
      <StatusBarDetails>
        <span></span>
        <small style={{ textTransform: 'capitalize' }} className={status === 'pending' ? 'blink-text' : ''}>
          {status}
        </small>
      </StatusBarDetails>

      <EndpointStatusEntries data-testid="endpoint-url">
        {statusEntries?.map((entry) => (
          <EndpointStatusTick
            key={entry.timestamp}
            style={{
              backgroundColor: entry.ok
                ? entry.responseTime > 1000
                  ? 'var(--color-orange)'
                  : 'var(--color-green)'
                : entry.status === 'n/a'
                ? 'var(--color-gray-300)'
                : 'var(--color-red)',
            }}
            title={`${entry.status}${entry.responseTime > 1000 ? ' (> 1 sec)' : ''}: ${moment(entry.timestamp).format(
              'HH:mm A'
            )}`}
          />
        ))}
      </EndpointStatusEntries>
      <StatusBarDetails>
        <small>{statusEntries && getTimestamp(statusEntries[0]?.timestamp)}</small>
        <small>Now</small>
      </StatusBarDetails>
    </div>
  );
};
