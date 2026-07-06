import { GoabContainer } from '@abgov/react-components';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

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
    id: 'Jsonforms ',
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
    id: 'Status Service',
    name: 'Status  service',
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

const ServiceContainer = styled.div`
  margin: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 16px; /* Your desired spacing between items */
`;

const FlexItem = styled.div`
  flex: 0 0 calc((100% - (16px * 3)) / 3);
  box-sizing: border-box; /* Ensures padding doesn't break the layout */
`;

export default function Services() {
  const location = useLocation();

  return (
    <ServiceContainer>
      {SERVICES.map((service) => {
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
  );
}
