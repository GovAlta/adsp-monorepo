import React, { FunctionComponent, useState } from 'react';
import { Aside, Main, Page } from '@components/Html';
import { Tab, Tabs } from '@components/Tabs';
import { CommentOverview } from './overview';
import { CommentTopicTypes } from './topicTypes/topicTypes';
import { HeadingDiv } from './styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import BetaBadge from '@icons/beta-badge.svg';

import AsideLinks from '@components/AsideLinks';

export const Comment: FunctionComponent = () => {
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const docBaseUrl = useSelector((state: RootState) => state.config.serviceUrls?.docServiceApiUrl);
  const [openAddTemplate, setOpenAddTemplate] = useState(false);

  const [openAddTopicTypes, setOpenAddTopicTypes] = useState(false);

  const searchParams = new URLSearchParams(document.location.search);

  const topicTypes = tenantName && searchParams.get('topicTypes');
  function getCommentDocsLink() {
    return `${docBaseUrl}/${tenantName?.replace(/ /g, '-')}?urls.primaryName=Comment service`;
  }
  function getCommentSupportCodeLink() {
    return 'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/comment-service';
  }

  return (
    <Page>
      <Main>
        <HeadingDiv>
          <h1 data-testid="comment-service-title">Comment service</h1>
          <img src={BetaBadge} alt="Comment Service" />
        </HeadingDiv>
        <Tabs activeIndex={topicTypes === 'true' ? 1 : 0} data-testid="comment-service-tabs">
          <Tab label="Overview" data-testid="comment-service-overview-tab">
            <CommentOverview setOpenAddTopicTypes={setOpenAddTopicTypes} />
          </Tab>
          <Tab label="Topic types" data-testid="comment-topic-types">
            <CommentTopicTypes openAddTopicTypes={openAddTopicTypes} />
          </Tab>
        </Tabs>
      </Main>
      <Aside>
        <AsideLinks serviceLink={getCommentSupportCodeLink()} docsLink={getCommentDocsLink()} />
      </Aside>
    </Page>
  );
};
