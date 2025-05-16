import React, { useEffect, useState } from 'react';
import exportFromJSON from 'export-from-json';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { FeedbackListTable } from './feedbacksTable';

import { renderNoItem } from '@components/NoItem';
import {
  GoABadge,
  GoAButton,
  GoACircularProgress,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAInputDate,
  GoASkeleton,
} from '@abgov/react-components';
import { LoadMoreWrapper } from '@components/styled-components';
import { FeedbackSearchCriteria, getDefaultSearchCriteria } from '@store/feedback/models';
import { exportFeedbacks, getFeedbackSites, getFeedbacks } from '@store/feedback/actions';
import { ExportDates, FeedbackFilterError, ProgressWrapper } from '../styled-components';
import { transformedData } from '../ratings';

interface VisibleProps {
  visible: boolean;
}
interface ExportObj {
  timestamp?: string;
  site?: string;
  view?: string;
  correlationId?: string;
  rating?: string;
  ratingValue?: string;
  comment?: string;
  technicalIssue?: string;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const FeedbacksList = (): JSX.Element => {
  const dispatch = useDispatch();
  const sites = useSelector((state: RootState) => state.feedback.sites);
  const [selectedSite, setSelectedSite] = useState('');
  const [searchCriteria, setSearchCriteria] = useState(getDefaultSearchCriteria);
  const [isExport, setIsExport] = useState(false);
  const [showDateError, setShowDateError] = useState<boolean>(false);

  const tenantName = useSelector((state: RootState) => {
    return state?.tenant?.name;
  });

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const isSearchCriteriaValid = (criteria?: FeedbackSearchCriteria) => {
    return new Date(criteria.startDate) < new Date(criteria.endDate);
  };

  const feedbacks = useSelector((state: RootState) => {
    return state?.feedback.feedbacks;
  });
  const exportData = useSelector((state: RootState) => state.feedback.exportData);
  const next = useSelector((state: RootState) => state.feedback.nextEntries);
  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSite) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    }
  }, [selectedSite]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedSite && searchCriteria.startDate && searchCriteria.endDate) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    }
  }, [searchCriteria]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNext = () => {
    const selectedSiteData = sites.find((s) => s.url === selectedSite);
    dispatch(getFeedbacks(selectedSiteData, searchCriteria ? searchCriteria : {}, next));
  };

  const exportToCsv = () => {
    setIsExport(true);
    dispatch(exportFeedbacks({ site: selectedSite }, searchCriteria));
  };

  const flattenJSON = (data) => {
    const flattenObject = (obj) => {
      const flat: ExportObj = {};

      if (obj.timestamp) {
        const date = new Date(obj.timestamp);
        flat.timestamp = date.toLocaleString();
      }
      if (obj.context && obj.context.site) flat.site = obj.context.site;
      if (obj.context && obj.context.view) flat.view = obj.context.view;
      if (obj.context && obj.correlationId) flat.correlationId = obj.correlationId;
      if (obj.value && obj.value.rating) flat.rating = obj.value.rating;
      if (obj.value && obj.value.ratingValue !== undefined) flat.ratingValue = obj.value.ratingValue;
      if (obj.value && obj.value.comment !== undefined) flat.comment = obj.value.comment;
      if (obj.value && obj.value.technicalIssue !== undefined) flat.technicalIssue = obj.value.technicalIssue;

      return flat;
    };

    return data.map((item) => flattenObject(item));
  };

  useEffect(() => {
    if (isExport) {
      const transformData = transformedData(exportData);
      const data = flattenJSON(transformData);
      const fileName = `${tenantName}-feedbacks`;
      const exportType = exportFromJSON.types.csv;
      exportFromJSON({ data, fileName, exportType });
      setIsExport(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportData]);

  return (
    <section>
      {!sites && renderNoItem('feedback')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback')}
      {sites && Object.keys(sites).length > 0 && (
        <div>
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
                relative={true}
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
          <ExportDates>
            <GoAFormItem label="Start date" helpText="File will be exported as a CSV">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-start-date"
                value={selectedSite && searchCriteria.startDate}
                disabled={!selectedSite}
                onChange={(name, value) => {
                  searchCriteria.startDate = new Date(value).toISOString();
                  if (!isSearchCriteriaValid(searchCriteria)) {
                    setShowDateError(true);
                  } else {
                    setShowDateError(false);
                    setSearchCriteria({
                      startDate: searchCriteria.startDate,
                      endDate: searchCriteria.endDate,
                      isExport: false,
                    });
                  }
                }}
                testId="startDate"
              />
            </GoAFormItem>

            <GoAFormItem label="End date">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-end-date"
                value={selectedSite && searchCriteria.endDate}
                disabled={!selectedSite}
                onChange={(name, value) => {
                  searchCriteria.endDate = new Date(value).toISOString();
                  if (!isSearchCriteriaValid(searchCriteria)) {
                    setShowDateError(true);
                  } else {
                    setShowDateError(false);
                    setSearchCriteria({
                      startDate: searchCriteria.startDate,
                      endDate: searchCriteria.endDate,
                      isExport: false,
                    });
                  }
                }}
                testId="endDate"
              />
            </GoAFormItem>
          </ExportDates>
          {showDateError && (
            <div>
              <GoABadge type="emergency" icon />
              <FeedbackFilterError>Start date timestamp should be after the end date timestamp.</FeedbackFilterError>
            </div>
          )}
          <GoAButton
            type="primary"
            size="normal"
            variant="normal"
            onClick={exportToCsv}
            testId="exportBtn"
            disabled={!selectedSite || showDateError || Object.keys(feedbacks).length === 0}
          >
            Export
          </GoAButton>
        </div>
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
      {selectedSite !== '' && !searchCriteria.isExport && feedbacks && Object.keys(feedbacks).length !== 0 && (
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
