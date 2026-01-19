import React, { useEffect, useState } from 'react';
import exportFromJSON from 'export-from-json';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { FeedbackListTable } from './feedbacksTable';
import { renderNoItem } from '@components/NoItem';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabSkeleton,
} from '@abgov/react-components';
import { LoadMoreWrapper } from '@components/styled-components';
import { FeedbackSearchCriteria, getDefaultSearchCriteria } from '@store/feedback/models';
import { exportFeedbacks, getFeedbackSites, getFeedbacks } from '@store/feedback/actions';
import { ExportDates, FeedbackFilterError, ProgressWrapper } from '../styled-components';
import { transformedData } from '../ratings';
import { FullScreenModalWrapper } from '../styled-components';
import { GoabInputOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

const Visible = styled.div<{ visible: boolean }>`
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
  const [expandView, setExpandView] = useState(false);

  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSite) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    } //eslint-disable-next-line
  }, [selectedSite]);

  useEffect(() => {
    if (selectedSite && searchCriteria.startDate && searchCriteria.endDate) {
      const selectedSiteData = sites.find((s) => s.url === selectedSite);
      dispatch(getFeedbacks(selectedSiteData, searchCriteria));
    } //eslint-disable-next-line
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
    return data.map((obj) => ({
      timestamp: obj.timestamp ? new Date(obj.timestamp).toLocaleString() : undefined,
      site: obj.context?.site,
      view: obj.context?.view,
      correlationId: obj.context?.correlationId,
      rating: obj.value?.rating,
      ratingValue: obj.value?.ratingValue?.toString(),
      comment: obj.value?.comment,
      technicalIssue: obj.value?.technicalIssue,
    }));
  };
  const renderLoadMoreButton = () => {
    return (
      next && (
        <LoadMoreWrapper>
          <GoabButton type="tertiary" onClick={onNext}>
            Load more
          </GoabButton>
        </LoadMoreWrapper>
      )
    );
  };

  useEffect(() => {
    if (isExport) {
      const transformData = transformedData(exportData);
      const data = flattenJSON(transformData);
      const fileName = `${tenantName}-feedbacks`;
      exportFromJSON({ data, fileName, exportType: exportFromJSON.types.csv });
      setIsExport(false);
    } //eslint-disable-next-line
  }, [exportData]);

  const sharedFilterForm = (
    <div>
      <GoabFormItem label="Registered sites">
        {indicator.show && Object.keys(sites).length === 0 && <GoabSkeleton type="text" />}
        <GoabDropdown
          name="Sites"
          value={selectedSite}
          onChange={(detail: GoabDropdownOnChangeDetail) => setSelectedSite(detail.value)}
          width={expandView ? '60%' : '100%'}
          testId="sites-dropdown"
        >
          {sites.map((item) => (
            <GoabDropdownItem key={item.url} label={item.url} value={item.url} />
          ))}
        </GoabDropdown>
      </GoabFormItem>
      <ExportDates>
        <GoabFormItem label="Start date">
          <GoabInput
            type="date"
            width="30ch"
            name="feedback-filter-start-date"
            value={selectedSite && new Date(searchCriteria.startDate).toISOString().slice(0, 10)}
            disabled={!selectedSite}
            onChange={(detail: GoabInputOnChangeDetail) => {
              const updated = { ...searchCriteria, startDate: new Date(detail.value).toISOString() };
              setSearchCriteria(updated);
              setShowDateError(!isSearchCriteriaValid(updated));
            }}
          />
        </GoabFormItem>

        <GoabFormItem label="End date">
          <GoabInput
            type="date"
            width="30ch"
            name="feedback-filter-end-date"
            value={selectedSite && new Date(searchCriteria.endDate).toISOString().slice(0, 10)}
            disabled={!selectedSite}
            onChange={(detail: GoabInputOnChangeDetail) => {
              const updated = { ...searchCriteria, endDate: new Date(detail.value).toISOString() };
              setSearchCriteria(updated);
              setShowDateError(!isSearchCriteriaValid(updated));
            }}
          />
        </GoabFormItem>
      </ExportDates>
    </div>
  );

  return (
    <section>
      {expandView && (
        <FullScreenModalWrapper>
          <h2 style={{ margin: 0 }}>Feedback service</h2>
          <GoabButton
            type="tertiary"
            leadingIcon="arrow-back"
            size="compact"
            mt="s"
            mb="s"
            onClick={() => setExpandView(false)}
          >
            Back to default view
          </GoabButton>
          {sharedFilterForm}

          <GoabButtonGroup alignment="start" gap="compact">
            <GoabButton
              type="primary"
              onClick={exportToCsv}
              disabled={!selectedSite || showDateError || feedbacks.length === 0}
            >
              Export CSV
            </GoabButton>
            <GoabButton type="secondary" trailingIcon="contract" onClick={() => setExpandView(false)}>
              Collapse view
            </GoabButton>
          </GoabButtonGroup>

          {!indicator.show && feedbacks.length === 0 && renderNoItem('feedbacks')}
          {feedbacks.length > 0 && <FeedbackListTable feedbacks={feedbacks} showDetailsToggle={false} />}
          {renderLoadMoreButton()}
        </FullScreenModalWrapper>
      )}

      {!sites && renderNoItem('feedback')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback')}

      {sites && Object.keys(sites).length > 0 && (
        <div>
          {sharedFilterForm}

          {showDateError && (
            <div>
              <GoabBadge type="emergency" icon />
              <FeedbackFilterError>Start date must be before End date.</FeedbackFilterError>
            </div>
          )}
          <GoabButtonGroup alignment="start" gap="compact">
            <GoabButton
              type="primary"
              onClick={exportToCsv}
              disabled={!selectedSite || showDateError || feedbacks.length === 0}
            >
              Export CSV
            </GoabButton>
            <GoabButton
              type="secondary"
              trailingIcon="expand"
              onClick={() => setExpandView(true)}
              disabled={!selectedSite}
            >
              Expand view
            </GoabButton>
          </GoabButtonGroup>
        </div>
      )}

      {!next && indicator.show && (
        <ProgressWrapper>
          <GoabCircularProgress visible={indicator.show} size="small" />
        </ProgressWrapper>
      )}

      {!indicator.show && selectedSite && feedbacks.length === 0 && renderNoItem('feedbacks')}

      {selectedSite && feedbacks.length > 0 && (
        <Visible visible={!expandView}>
          <FeedbackListTable feedbacks={feedbacks} showDetailsToggle={true} />
          {renderLoadMoreButton()}
        </Visible>
      )}
    </section>
  );
};
