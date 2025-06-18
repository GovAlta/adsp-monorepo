import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoAButton, GoACircularProgress } from '@abgov/react-components';
import exportFromJSON from 'export-from-json';
import { RootState } from '@store/index';
import { getFeedbacks, exportFeedbacks } from '@store/feedback/actions';
import { transformedData } from '../ratings';
import { FeedbackListTable } from './feedbacksTable';
import { FeedbackHeader } from '../styled-components';

export const FeedbackResults = (): JSX.Element => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isExport, setIsExport] = useState(false);

  const feedbacks = useSelector((state: RootState) => state.feedback.feedbacks);
  const sites = useSelector((state: RootState) => state.feedback.sites);
  const exportData = useSelector((state: RootState) => state.feedback.exportData);
  const tenantName = useSelector((state: RootState) => state?.tenant?.name);
  const indicator = useSelector((state: RootState) => state?.session?.indicator);

  const searchParams = new URLSearchParams(location.search);
  const selectedSite = searchParams.get('site');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  useEffect(() => {
    const siteData = sites.find((s) => s.url === selectedSite);
    if (siteData) {
      dispatch(getFeedbacks(siteData, { startDate, endDate }));
    }
  }, [selectedSite, startDate, endDate, sites, dispatch]);

  const exportToCsv = () => {
    dispatch(exportFeedbacks({ site: selectedSite }, { startDate, endDate }));
    setIsExport(true);
  };

  useEffect(() => {
    if (isExport && exportData && exportData.length > 0) {
      const transformData = transformedData(exportData);
      const fileName = `${tenantName}-feedbacks`;
      const exportType = exportFromJSON.types.csv;
      exportFromJSON({ data: transformData, fileName, exportType });
    }
  }, [isExport, exportData, tenantName]);

  return (
    <section>
      <GoAButton type="tertiary" leadingIcon="backspace" onClick={() => navigate('/admin/services/feedback')}>
        Back
      </GoAButton>

      <FeedbackHeader>
        <h2>Feedback Results</h2>
        {feedbacks?.length > 0 && !indicator.show && (
          <GoAButton type="primary" onClick={exportToCsv}>
            Export CSV
          </GoAButton>
        )}
      </FeedbackHeader>

      {indicator.show && <GoACircularProgress visible size="small" />}

      {!indicator.show && feedbacks?.length > 0 && <FeedbackListTable feedbacks={feedbacks} />}
    </section>
  );
};
