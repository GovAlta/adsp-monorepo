import { RootState } from '@store/index';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const Example = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
  margin-bottom: 1rem;
`;

export const DirectoryOverview: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  return (
    <div>
      <p>
        The directory service is a register of services and their APIs. Applications can use the directory API to lookup
        URLs for services. Directory information is public and anonymous frontend applications can read this
        information. Add your own entry so they can be found using the directory.
      </p>
      <section>
        <h2>Service metadata</h2>
        <p>
          For services, the directory will make a GET request at the associated URL to look for additional metadata.
          Return a response body like the following example to provide information about your service.
        </p>
        <Example>
          {JSON.stringify(
            {
              name: 'My service',
              description: 'My service for doing service things.',
              _links: {
                self: { href: 'https://my-service.alberta.ca' },
                api: { href: 'https://my-service.alberta.ca/my-service/v1' },
                health: { href: 'https://my-service.alberta.ca/health' },
                docs: { href: 'https://my-service.alberta.ca/swagger/docs/v1' },
              },
            },
            null,
            2
          )}
        </Example>
        <p>
          Include the Swagger JSON URL in this metadata to have the{' '}
          <a
            rel="noopener noreferrer"
            target="_blank"
            href={`${docBaseUrl}/${tenantName?.toLowerCase().replace(/ /g, '-')}`}
          >
            API docs application
          </a>{' '}
          aggregate your API along with platform APIs.
        </p>
      </section>
    </div>
  );
};
