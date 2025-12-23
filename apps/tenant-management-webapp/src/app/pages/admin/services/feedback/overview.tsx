import React, { FunctionComponent, useEffect } from 'react';
import { GoabButton } from '@abgov/react-components';

import { useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';

import { FeedbackMetrics } from './metrics';
import { fetchFeedbackMetrics, fetchFeedbackMetricsMonthlyChange } from '@store/feedback/actions';

interface OverviewProps {
  setActiveEdit: (boolean) => void;
}

export const showTaggingFeature = false;

export const FeedbackOverview: FunctionComponent<OverviewProps> = (props) => {
  const { setActiveEdit } = props;

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  const navigate = useNavigate();
  useEffect(() => {
    setActiveEdit(false);
    navigate('/admin/services/feedback');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchFeedbackMetrics());
    dispatch(fetchFeedbackMetricsMonthlyChange());
  }, [dispatch]);

  return (
    <section>
      <FeedbackMetrics />
      <GoabButton
        testId="add-feedback"
        onClick={() => {
          setActiveEdit(true);
          navigate('/admin/services/feedback?sites=true');
        }}
      >
        Register site
      </GoabButton>
    </section>
  );
};
