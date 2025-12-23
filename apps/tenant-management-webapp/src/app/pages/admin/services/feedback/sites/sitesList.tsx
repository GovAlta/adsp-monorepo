import React, { FunctionComponent, useState } from 'react';
import { useSelector } from 'react-redux';
import DataTable from '@components/DataTable';
import { RootState } from '@store/index';
import type { FeedbackSite } from '@store/feedback/models';
import styled from 'styled-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { renderNoItem } from '@components/NoItem';
import { TagBadgePadding, DetailsTagWrapper, DetailsTagHeading } from '../../form/styled-components';
import { GoabBadge } from '@abgov/react-components';
import { showTaggingFeature } from '../overview';

interface SiteProps {
  site: FeedbackSite;
  readonly?: boolean;
  onEdit: (site: FeedbackSite) => void;
  onDelete: (site: FeedbackSite) => void;
  siteindex?: number;
}

const SiteComponent: FunctionComponent<SiteProps> = ({ site, onEdit, onDelete, siteindex }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <tr>
        <td headers="Site" data-testid="site">
          {site.url}
        </td>
        <td headers="Allow Anonymous" data-testid="allowAnonymous">
          {site.allowAnonymous ? 'Yes' : 'No'}
        </td>
        <td>
          <GoAContextMenu>
            <GoAContextMenuIcon testId="site-edit" title="Edit" type="create" onClick={() => onEdit(site)} />
            <GoAContextMenuIcon
              testId={`site-delete-${siteindex}`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(site)}
            />
            {showTaggingFeature && site.tags?.length > 0 && (
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => setShowDetails(!showDetails)}
                testId="toggle-details-visibility"
              />
            )}
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td className="payload-details" headers="namespace name description payload" colSpan={5}>
            {site && site.tags?.length > 0 && (
              <>
                <DetailsTagHeading>Tags</DetailsTagHeading>

                <DetailsTagWrapper>
                  {site.tags.map((tag) => (
                    <TagBadgePadding>
                      <GoabBadge type={'midtone'} content={tag} testId={tag} mb="xs" mr="xs" icon={false} />
                    </TagBadgePadding>
                  ))}
                </DetailsTagWrapper>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

interface SitesListComponentProps {
  onEdit: (site: FeedbackSite) => void;
  onDelete: (site: FeedbackSite) => void;
}

const SitesListComponent: FunctionComponent<SitesListComponentProps> = ({ onEdit, onDelete }) => {
  const sites = useSelector((state: RootState) => state.feedback?.sites || []);
  return (
    <div>
      {!sites.length && renderNoItem('sites')}
      {sites.length > 0 && (
        <DataTable data-testid="feedbacks-sites-table">
          <thead data-testid="feedbacks-sites-table-header">
            <tr>
              <th id="name" data-testid="feedbacks-sites-table-header-name">
                Site URL
              </th>
              <th id="anonymous" data-testid="feedback-anonymous">
                Anonymous
              </th>
              <th id="action" data-testid="feedback-actions">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, index) => (
              <SiteComponent onEdit={onEdit} onDelete={onDelete} key={`${site.url}`} siteindex={index} site={site} />
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
};

export const SitesList = styled(SitesListComponent)`
  display: flex-inline-table;
  & .group-name {
    font-size: var(--goa-font-size-5);
    font-weight: var(--fw-bold);
  }

  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & .payload-details {
    div {
      background: #f3f3f3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
      line-height: 16px;
      padding: 16px;
    }
    padding: 0;
  }

  table {
    margin-bottom: 2rem;
  }
`;
