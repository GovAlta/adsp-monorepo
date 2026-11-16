import React, { useEffect, useState } from 'react';
import exportFromJSON from 'export-from-json';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { FeedbackListTable } from './feedbacksTable';
import { FeedbackSummary, FeedbackSummaryLoading } from './feedbackSummary';
import { renderNoItem } from '@components/NoItem';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabSkeleton,
} from '@abgov/react-components';
import { DEFAULT_FEEDBACK_PAGE_SIZE, FeedbackSearchCriteria, getDefaultSearchCriteria } from '@store/feedback/models';
import {
  clearFeedbackSummary,
  exportFeedbacks,
  getFeedbackSites,
  getFeedbacks,
  getFeedbackSummary,
} from '@store/feedback/actions';
import { FeedbackPagination } from './feedbackPagination';
import { ExportDates, FeedbackFilterError, FeedbackFilterErrorWrapper } from '../styled-components';
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
  const feedbackPage = useSelector((state: RootState) => state.feedback.page);
  const summary = useSelector((state: RootState) => state.feedback.summary);

  const [selectedSite, setSelectedSite] = useState('');
  const [searchCriteria, setSearchCriteria] = useState(getDefaultSearchCriteria);
  const [pageSize, setPageSize] = useState(DEFAULT_FEEDBACK_PAGE_SIZE);
  const [isExport, setIsExport] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [expandView, setExpandView] = useState(false);

  const selectedSiteData = Array.isArray(sites) ? sites.find((s) => s.url === selectedSite) : undefined;

  useEffect(() => {
    dispatch(getFeedbackSites());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSiteData) {
      // A new site, date range or page size starts again from the first page with a fresh total.
      dispatch(getFeedbacks(selectedSiteData, searchCriteria, 1, pageSize, true));
    }
  }, [dispatch, searchCriteria, selectedSiteData, pageSize]);

  const isSearchCriteriaValid = (criteria: FeedbackSearchCriteria) =>
    new Date(criteria.startDate) <= new Date(criteria.endDate);

  useEffect(() => {
    if (
      selectedSiteData &&
      searchCriteria.startDate &&
      searchCriteria.endDate &&
      isSearchCriteriaValid(searchCriteria)
    ) {
      dispatch(getFeedbackSummary(selectedSiteData.url, searchCriteria));
    } else {
      dispatch(clearFeedbackSummary());
    }
  }, [dispatch, searchCriteria, selectedSiteData]);

  const onPage = (page: number) => {
    dispatch(getFeedbacks(selectedSiteData, searchCriteria, page, pageSize));
  };

  useEffect(() => {
    if (isExport) {
      const transformData = transformedData(exportData);
      const data = transformData && typeof transformData === 'object' ? flattenJSON(transformData) : {};
      const fileName = `${tenantName}-feedbacks`;
      exportFromJSON({ data, fileName, exportType: exportFromJSON.types.csv });
      setIsExport(false);
    }
  }, [exportData, isExport, tenantName]);

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
  const renderPagination = () =>
    feedbackPage && (
      <FeedbackPagination
        page={feedbackPage.page}
        pageSize={feedbackPage.pageSize}
        shownCount={feedbacks.length}
        total={feedbackPage.total}
        onPage={onPage}
        onPageSize={setPageSize}
      />
    );

  const sharedFilterForm = (
    <div>
      <GoabFormItem label="Registered sites">
        {indicator.show && (!sites || Object.keys(sites).length === 0) && <GoabSkeleton type="text" />}
        <GoabDropdown
          size="compact"
          name="Sites"
          value={selectedSite}
          onChange={(detail: GoabDropdownOnChangeDetail) =>
            setSelectedSite(Array.isArray(detail.value) ? detail.value[0] : detail?.value)
          }
          width={'62ch'}
          testId="sites-dropdown"
        >
          {Array.isArray(sites) &&
            sites &&
            sites.map((item) => <GoabDropdownItem key={item.url} label={item.url} value={item.url} />)}
        </GoabDropdown>
      </GoabFormItem>
      <ExportDates>
        <GoabFormItem label="Start date">
          <GoabInput
            size="compact"
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
            size="compact"
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
            type="text"
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
              size="compact"
              type="primary"
              onClick={exportToCsv}
              disabled={!selectedSite || showDateError || feedbacks.length === 0}
            >
              Export CSV
            </GoabButton>
            <GoabButton size="compact" type="secondary" trailingIcon="contract" onClick={() => setExpandView(false)}>
              Collapse view
            </GoabButton>
          </GoabButtonGroup>

          {summary ? <FeedbackSummary summary={summary} /> : <FeedbackSummaryLoading />}
          {!indicator.show && feedbacks.length === 0 && renderNoItem('feedbacks')}
          {feedbacks.length > 0 && (
            <>
              <FeedbackListTable feedbacks={feedbacks} showDetailsToggle={false} />
              {renderPagination()}
            </>
          )}
        </FullScreenModalWrapper>
      )}

      {!sites && renderNoItem('feedback')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback')}

      {sites && Object.keys(sites).length > 0 && (
        <div>
          {sharedFilterForm}

          {showDateError && (
            <FeedbackFilterErrorWrapper>
              <GoabBadge type="emergency" icon />
              <FeedbackFilterError>Start date must be before End date.</FeedbackFilterError>
            </FeedbackFilterErrorWrapper>
          )}
          <GoabButtonGroup alignment="start" gap="compact">
            <GoabButton
              size="compact"
              type="primary"
              onClick={exportToCsv}
              disabled={!selectedSite || showDateError || feedbacks.length === 0}
            >
              Export CSV
            </GoabButton>
            <GoabButton
              size="compact"
              type="secondary"
              trailingIcon="expand"
              onClick={() => setExpandView(true)}
              disabled={!selectedSite || feedbacks.length === 0}
              testId="expand-feedback-view"
            >
              Expand view
            </GoabButton>
          </GoabButtonGroup>
        </div>
      )}

      {!expandView &&
        selectedSite &&
        !showDateError &&
        (summary ? <FeedbackSummary summary={summary} /> : <FeedbackSummaryLoading />)}
      {!indicator.show && selectedSite && feedbacks.length === 0 && renderNoItem('feedbacks')}

      {selectedSite && feedbacks.length > 0 && (
        <Visible visible={!expandView}>
          <FeedbackListTable feedbacks={feedbacks} showDetailsToggle={true} />
          {renderPagination()}
        </Visible>
      )}
    </section>
  );
};
