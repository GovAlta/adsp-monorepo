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
  visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
`;

export const FeedbacksList = (): JSX.Element => {
  const dispatch = useDispatch();

  const sites = useSelector((state: RootState) => state.feedback.sites);
  const feedbacks = useSelector((state: RootState) => state.feedback.feedbacks);
  const exportData = useSelector((state: RootState) => state.feedback.exportData);
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const indicator = useSelector((state: RootState) => state.session?.indicator);
  const next = useSelector((state: RootState) => state.feedback.nextEntries);

  const [selectedSite, setSelectedSite] = useState('');
  const [searchCriteria, setSearchCriteria] = useState(getDefaultSearchCriteria);
  const [isExport, setIsExport] = useState(false);
  const [showDateError, setShowDateError] = useState(false);

  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSite) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedSite && searchCriteria.startDate && searchCriteria.endDate) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    }
  }, [searchCriteria]);

  const isSearchCriteriaValid = (criteria: FeedbackSearchCriteria) =>
    new Date(criteria.startDate) <= new Date(criteria.endDate);

  const onNext = () => {
    const selectedSiteData = sites.find((s) => s.url === selectedSite);
    dispatch(getFeedbacks(selectedSiteData, searchCriteria, next));
  };

  const exportToCsv = () => {
    setIsExport(true);
    dispatch(exportFeedbacks({ site: selectedSite }, searchCriteria));
  };

  const flattenJSON = (data) => {
    return data.map((obj): ExportObj => {
      const flat: ExportObj = {
        timestamp: obj.timestamp ? new Date(obj.timestamp).toLocaleString() : undefined,
        site: obj.context?.site,
        view: obj.context?.view,
        correlationId: obj.context?.correlationId,
        rating: obj.value?.rating,
        ratingValue: obj.value?.ratingValue?.toString(),
        comment: obj.value?.comment,
        technicalIssue: obj.value?.technicalIssue,
      };
      return flat;
    });
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
  }, [exportData]);

  return (
    <section>
      {!sites && renderNoItem('feedback')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback')}

      {sites && Object.keys(sites).length > 0 && (
        <div>
          <GoAFormItem label="Registered sites">
            {indicator.show && Object.keys(sites).length === 0 && <GoASkeleton type="text" />}
            <GoADropdown
              name="Sites"
              value={selectedSite}
              onChange={(name, site: string) => setSelectedSite(site)}
              width="100%"
              testId="sites-dropdown"
              relative={true}
            >
              {sites.map((item) => (
                <GoADropdownItem key={item.url} label={item.url} value={item.url} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <ExportDates>
            <GoAFormItem label="Start date">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-start-date"
                value={selectedSite && searchCriteria.startDate}
                disabled={!selectedSite}
                onChange={(name, value) => {
                  const updated = { ...searchCriteria, startDate: new Date(value).toISOString() };
                  setSearchCriteria(updated);
                  setShowDateError(!isSearchCriteriaValid(updated));
                }}
              />
            </GoAFormItem>

            <GoAFormItem label="End date">
              <GoAInputDate
                width="30ch"
                name="feedback-filter-end-date"
                value={selectedSite && searchCriteria.endDate}
                disabled={!selectedSite}
                onChange={(name, value) => {
                  const updated = { ...searchCriteria, endDate: new Date(value).toISOString() };
                  setSearchCriteria(updated);
                  setShowDateError(!isSearchCriteriaValid(updated));
                }}
              />
            </GoAFormItem>
          </ExportDates>

          {showDateError && (
            <div>
              <GoABadge type="emergency" icon />
              <FeedbackFilterError>Start date must be before End date.</FeedbackFilterError>
            </div>
          )}

          <GoAButton
            type="primary"
            onClick={exportToCsv}
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

      {!indicator.show && selectedSite && Object.keys(feedbacks).length === 0 && renderNoItem('feedbacks')}

      {selectedSite && Object.keys(feedbacks).length > 0 && (
        <Visible visible={true}>
          <FeedbackListTable feedbacks={feedbacks} />
          {next && (
            <LoadMoreWrapper>
              <GoAButton type="tertiary" onClick={onNext}>
                Load more
              </GoAButton>
            </LoadMoreWrapper>
          )}
        </Visible>
      )}
    </section>
  );
};
