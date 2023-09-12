import React, { FunctionComponent, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { CommentOverview } from './overview';

import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

import AsideLinks from '@components/AsideLinks';

export const Comment: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [openAddTemplate, setOpenAddTemplate] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const templates = tenantName && searchParams.get('templates');
  function getCommentDocsLink() {
    return `${docBaseUrl}/${tenantName?.replace(/ /g, '-')}?urls.primaryName=Comment service`;
  }
  function getCommentsupportcodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/comment-service';
  }
  return (
    <Page>
      <Main>
        <h1 data-testid="comment-service-title">Comment service</h1>
        <Tabs activeIndex={templates === 'true' ? 1 : 0} data-testid="comment-service-tabs">
          <Tab label="Overview" data-testid="comment-service-overview-tab">
            <CommentOverview setOpenAddTemplate={setOpenAddTemplate} />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceLink={getCommentsupportcodeLink()} docsLink={getCommentDocsLink()} />
      </Aside>
    </Page>
  );
};
