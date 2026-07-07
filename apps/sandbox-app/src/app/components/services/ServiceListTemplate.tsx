import React from 'react';
import { Link } from 'react-router-dom';

export interface ServicePage {
  id: string;
  name: string;
  url: string;
  testId: string;
}

interface ServiceListTemplateProps {
  servicePages: ServicePage[];
}

export const ServiceListTemplate = ({ servicePages }: ServiceListTemplateProps) => {
  return (
    <ul>
      {servicePages.map((page, y) => {
        return (
          <li id={`${page.id}_${y}`}>
            <Link id={`${page.id}`} to={`${page.url}`} data-testId={`${page.testId}`}>
              {page.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
