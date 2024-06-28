import React, { useEffect, useState } from 'react';
import exportFromJSON from 'export-from-json';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { FeedbackListTable } from './feedbacksTable';
import { flattenDepth } from 'lodash';

import { renderNoItem } from '@components/NoItem';
import {
  GoAButton,
  GoACircularProgress,
  GoADate,
  GoADropdown,
  GoADropdownItem,
  GoAFormItem,
  GoAGrid,
  GoAInput,
  GoAInputDate,
  GoASkeleton,
} from '@abgov/react-components-new';
import { LoadMoreWrapper } from '@components/styled-components';
import { FeedbackSite, defaultFeedbackSite, getDefaultSearchCriteria } from '@store/feedback/models';
import { exportFeedbacks, getFeedbackSites, getFeedbacks } from '@store/feedback/actions';
import { ExportDates, ProgressWrapper } from './styled-components';

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
  const [searchCriteria, setSearchCriteria] = useState(getDefaultSearchCriteria);
  const [isExport, setIsExport] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

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
    const flattenObject = (obj, parentKey = '', result = {}) => {
      Object.keys(obj).forEach((key) => {
        const newKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          flattenObject(obj[key], newKey, result);
        } else {
          result[newKey] = obj[key];
        }
      });
      return result;
    };

    return data.map((item) => flattenObject(item));
  };

  useEffect(() => {
    if (isExport) {
      const data = flattenJSON(exportData);
      const fileName = 'download';
      const exportType = exportFromJSON.types.csv;
      exportFromJSON({ data, fileName, exportType });
      setIsExport(false);
    }
  }, [exportData]);

  return (
    <section>
      {!sites && renderNoItem('feedback sites')}
      {!indicator.show && sites && Object.keys(sites).length === 0 && renderNoItem('feedback sites')}
      {sites && Object.keys(sites).length > 0 && (
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
      {selectedSite !== '' && (
        <>
          <ExportDates>
            <GoAFormItem label="Start date" helpText="File will be exported as a CSV">
              <GoAInput
                type="date"
                width="22.54ch"
                name="calendar-event-filter-start-date"
                value={''}
                disabled={selectedSite === null}
                onChange={(name, value) => {
                  setSearchCriteria({
                    startDate: new Date(value).toISOString(),
                    endDate: searchCriteria.endDate,
                    isExport: false,
                  });
                }}
                testId="startDate"
              />
            </GoAFormItem>

            <GoAFormItem label="End date">
              <GoAInputDate
                width="22.54ch"
                name="calendar-event-filter-end-date"
                value={''}
                disabled={selectedSite === null}
                onChange={(name, value) => {
                  setSearchCriteria({
                    startDate: searchCriteria.startDate,
                    endDate: new Date(value).toISOString(),
                    isExport: false,
                  });
                }}
                testId="endDate"
              />
            </GoAFormItem>
          </ExportDates>
          <GoAButton type="secondary" size="normal" variant="normal" onClick={exportToCsv} testId="exportBtn">
            Export
          </GoAButton>
        </>
      )}
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
