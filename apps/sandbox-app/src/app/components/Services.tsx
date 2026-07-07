import { GoabAppFooter, GoabContainer } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FlexItem, ServiceContainer } from './styled-components';
import { Band } from '@core-services/app-common';
import Header from './Header';
import { useFeedbackWidget } from '../util/useFeedbackWidget';

interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  show: boolean;
  url: string;
}

const SERVICES: ServiceInfo[] = [
  {
    id: 'AgentService',
    name: 'Agent service',
    show: true,
    description: 'Agent related services',
    url: '/agent',
  },
  {
    id: 'CacheService',
    name: 'Cache service',
    show: true,
    description: 'Cache related services',
    url: '/cache',
  },
  {
    id: 'CalendarService',
    name: 'Calendar service',
    show: true,
    description: 'Calendar related services',
    url: '/calendar',
  },
  {
    id: 'ConfigurationService',
    name: 'Configuration service',
    show: true,
    description: 'Configuration related services',
    url: '/configuration',
  },
  {
    id: 'DirectoryService',
    name: 'Directory service',
    show: true,
    description: 'Directory related services',
    url: '/directory',
  },
  {
    id: 'DesignSystems',
    name: 'Design systems',
    show: true,
    description: 'Design systems ui components',
    url: '/design-systems',
  },
  {
    id: 'EventService',
    name: 'Event service',
    show: true,
    description: 'Event related services',
    url: '/event',
  },
  {
    id: 'FormService',
    name: 'Form service',
    show: true,
    description: 'Form related services',
    url: '/form',
  },
  {
    id: 'PdfService',
    name: 'PDF service',
    show: true,
    description: 'PDF related services',
    url: '/pdf',
  },
  {
    id: 'SharepointService',
    name: 'Sharepoint service',
    show: true,
    description: 'Sharepoint related services',
    url: '/sharepoint',
  },
  {
    id: 'ScriptService',
    name: 'Script service',
    show: true,
    description: 'Form related services',
    url: '/script',
  },
  {
    id: 'Jsonforms',
    name: 'Jsonforms',
    show: true,
    description: 'Jsonforms library',
    url: '/jsonforms',
  },
  {
    id: 'FileService',
    name: 'File service',
    show: true,
    description: 'File related services',
    url: '/file',
  },
  {
    id: 'Feedback service',
    name: 'Feedback service',
    show: true,
    description: 'Feedback related services',
    url: '/feedback',
  },
  {
    id: 'NotificationService',
    name: 'Notification service',
    show: true,
    description: 'Notification related services',
    url: '/notification',
  },
  {
    id: 'Status service',
    name: 'Status service',
    show: true,
    description: 'Status related services',
    url: '/status',
  },
  {
    id: 'Task service',
    name: 'Task service',
    show: true,
    description: 'Task related services',
    url: '/task',
  },
  {
    id: 'ValueService',
    name: 'Value service',
    show: true,
    description: 'Value related services',
    url: '/value',
  },
];

const sortServices = (services: ServiceInfo[], key: keyof ServiceInfo, direction: 'asc' | 'desc' = 'asc') => {
  return [...services].sort((a, b) => {
    const valA = String(a[key]).toLowerCase();
    const valB = String(b[key]).toLowerCase();
    const cmp = valA.localeCompare(valB);
    return direction === 'asc' ? cmp : -cmp;
  });
};

export default function Services() {
  const location = useLocation();
  useFeedbackWidget();
  return (
    <>
      <Header />
      <Band title="Sandbox services">Services/libraries available for POC</Band>
      <ServiceContainer>
        {sortServices(SERVICES, 'name').map((service, i) => {
          return (
            <FlexItem key={`${service.id}_${i}`}>
              <GoabContainer
                accent="thick"
                type="non-interactive"
                width={'full'}
                testId={service.id}
                heading={
                  <h3>
                    <Link to={`${location.pathname}${service.url}`}>{service.name}</Link>
                  </h3>
                }
              >
                {service.description}
              </GoabContainer>
            </FlexItem>
          );
        })}
      </ServiceContainer>
      <GoabAppFooter />
    </>
  );
}
