import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { FeedbackListTable } from './feedbacksTable';

import { renderNoItem } from '@components/NoItem';
import {
  GoAButton,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoASkeleton,
} from '@abgov/react-components-new';
import { LoadMoreWrapper } from '@components/styled-components';
import { FeedbackSite, defaultFeedbackSite } from '@store/feedback/models';
import { getFeedbackSites, getFeedbacks } from '@store/feedback/actions';
import { ProgressWrapper } from './styled-components';

interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const FeedbacksList = (): JSX.Element => {
  const dispatch = useDispatch();

  const sites = useSelector((state: RootState) => state.feedback.sites);
  const [selectedSite, setSelectedSite] = useState('');
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const feedbacks = useSelector((state: RootState) => {
    return state?.feedback.feedbacks;
  });
  const next = useSelector((state: RootState) => state.feedback.nextEntries);
  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSite) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData));
    }
  }, [selectedSite]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = () => {
    const selectedSiteData = sites.find((s) => s.url === selectedSite);
    dispatch(getFeedbacks(selectedSiteData, next));
  };

  return (
    <section>
      {!indicator.show && Object.keys(sites).length === 0 && renderNoItem('feedback sites')}
      {Object.keys(sites).length > 0 && (
        <GoAFormItem label="Registered sites">
          {indicator.show && Object.keys(sites).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          {Object.keys(sites).length > 0 && (
            <GoADropdown
              name="Sites"
              value={selectedSite}
              onChange={(name, site: string) => {
                setSelectedSite(site);
              }}
              aria-label="select-site-dropdown"
              width="100%"
              testId="sites-dropdown"
            >
              {sites.map((item) => (
                <GoADropdownItem
                  name="feedbacks"
                  key={item.url}
                  label={item.url}
                  value={item.url}
                  testId={`${item.url}`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
      )}

      {!next && indicator.show && (
        <ProgressWrapper>
          <GoACircularProgress visible={indicator.show} size="small" />
        </ProgressWrapper>
      )}
      {!indicator.show &&
        selectedSite !== '' &&
        feedbacks &&
        Object.keys(feedbacks).length === 0 &&
        renderNoItem('feedbacks')}
      {selectedSite !== '' && feedbacks && Object.keys(feedbacks).length !== 0 && (
        <Visible visible={selectedSite !== '' && feedbacks && Object.keys(feedbacks).length !== 0}>
          <FeedbackListTable feedbacks={feedbacks} />
          {next && (
            <LoadMoreWrapper>
              <GoAButton testId="sites-load-more-btn" key="sites-load-more-btn" type="tertiary" onClick={onNext}>
                Load more
              </GoAButton>
            </LoadMoreWrapper>
          )}
        </Visible>
      )}
    </section>
  );
};
