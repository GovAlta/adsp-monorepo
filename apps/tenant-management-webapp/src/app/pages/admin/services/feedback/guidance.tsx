import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { CodeSpan, PRE, FeedbackOverviewSection } from './styled-components';
import { useNavigate } from 'react-router-dom';
import { NoPaddingH2 } from '@components/AppHeader';
import { ExternalLink } from '@components/icons/ExternalLink';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';

import { fetchFeedbackMetrics } from '@store/feedback/actions';

interface GuidanceProps {
  setActiveEdit: (boolean) => void;
}

export const showTaggingFeature = false;

export const FeedbackGuidance: FunctionComponent<GuidanceProps> = (props) => {
  const { setActiveEdit } = props;

  const tenant = useSelector((state: RootState) => state.tenant);
  const feedbackServiceUrl = useSelector((state: RootState) => state.config.serviceUrls?.feedbackServiceUrl);
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
  }, [dispatch]);

  return (
    <section>
      <FeedbackOverviewSection>
        <p>
          The feedback service provides a backend API and a frontend widget for applications to accept feedback from
          users. Feedback comments are anonymized using the PII service and records are stored and available from the
          Value service API.
        </p>
        <NoPaddingH2>Sites</NoPaddingH2>
        <p>
          Configure the sites against which feedback is allowed. Enable anonymous feedback for a site so that
          unauthenticated users can send feedback directly to the API, but note that this could reduce the quality of
          feedback.
        </p>
        <NoPaddingH2>Feedback widget</NoPaddingH2>
        <p>
          Include the feedback script in your site, and initialize it from javascript. On initialization, the script
          will attach a widget element which includes a badge and form that users can use to send feedback.
        </p>
        <p>
          Reference the feedback widget script in <CodeSpan>&lt;head&gt;</CodeSpan> to set the{' '}
          <CodeSpan>adspFeedback</CodeSpan> global variable.
          <PRE>
            &lt;head&gt;
            <br />
            ...
            <br />
            &lt;script src=&quot;{feedbackServiceUrl}/feedback/v1/script/adspFeedback.js&quot;&gt;&lt;/script&gt;
            <br />
            &lt;/head&gt;
          </PRE>
        </p>
        <p>
          Initialize the widget via the <CodeSpan>adspFeedback</CodeSpan> variable in <CodeSpan>&lt;body&gt;</CodeSpan>{' '}
          to identify your tenant and mount the widget element to DOM. A <CodeSpan>getAccessToken</CodeSpan> function
          for feedback under the user's context is required for sites that don't allow anonymous feedback.
          <PRE>
            &lt;body&gt;
            <br />
            ...
            <br />
            &lt;script&gt;
            <br />
            adspFeedback.initialize(&#123;
            <br />
            {`  tenant: '${tenant.name}',`}
            <br />
            {`  getAccessToken: () => Promise.resolve(<token value>),`}
            <br />
            &#125;);
            <br />
            &lt;/script&gt;
            <br />
            &lt;/body&gt;
          </PRE>
        </p>
        <div>
          <p>For more information on integrating the feedback service with your application please see the </p>
          <ExternalLink
            testId="feedback-tutorial-link"
            link="https://govalta.github.io/adsp-monorepo/tutorials/feedback-service/collectingFeedback.html"
            text="feedback service tutorial"
          />
        </div>
      </FeedbackOverviewSection>
      <br />
      <GoAButton
        testId="add-feedback"
        onClick={() => {
          setActiveEdit(true);
          navigate('/admin/services/feedback?sites=true');
        }}
      >
        Register site
      </GoAButton>
    </section>
  );
};
