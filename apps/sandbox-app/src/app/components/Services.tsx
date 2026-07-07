import { GoabContainer } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FlexItem, ServiceContainer } from './styled-components';
import { Band } from '@core-services/app-common';
import Header from './Header';
import { useAdspFeedbackWidget } from '../util/useFeedbackWidget';

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
    id: 'ValueService',
    name: 'Value service',
    show: true,
    description: 'Value related services',
    url: '/value',
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
  useAdspFeedbackWidget();
  return (
    <>
      <Header />
      <Band title="Sandbox services">Services available for POC</Band>
      <ServiceContainer>
        {sortServices(SERVICES, 'name').map((service) => {
          return (
            <FlexItem>
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
    </>
  );
}
