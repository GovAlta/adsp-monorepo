import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { PRE, FeedbackSubHeading, FeedbackOverviewSection } from '../feedback/styled-components';
import { useNavigate } from 'react-router-dom';

interface OverviewProps {
  setActiveEdit: (boolean) => void;
}

export const FeedbackOverview: FunctionComponent<OverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex } = props;

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);
  const navigate = useNavigate();
  useEffect(() => {
    setActiveEdit(false);
    navigate('/admin/services/feedback');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <FeedbackOverviewSection>
        <p>
          The feedback service provides a backend API and a frontend widget for applications to accept feedback from
          users. Feedback comments are anonymized using the PII service and records are stored and available from the
          Value service API.
        </p>
        <FeedbackSubHeading>Sites section</FeedbackSubHeading>
        <p>
          Configure the sites against which feedback is allowed. Enable anonymous feedback for a site so that
          unauthenticated users can send feedback directly to the API, but note that this could reduce the quality of
          feedback.
        </p>
        <FeedbackSubHeading>Widget section</FeedbackSubHeading>
        <p>
          Include the feedback script in your site, and initialize it from javascript. On initialization, the script
          will attach a widget element which includes a badge and form that users can use to send feedback.
        </p>
        <ul className="goa-unordered-list">
          <li>Include a code example of the &lt;script&gt; with src to feedback API in &lt;head&gt;</li>
          <li>
            include a code example of the &lt;script&gt; in body to{' '}
            <PRE>adspFeedback.initialize(&#123;tenant: &quot;&lt;tenant name&gt;&quot;&#125;)</PRE>
          </li>
        </ul>
      </FeedbackOverviewSection>
      <GoAButton
        testId="add-feedback"
        onClick={() => {
          setActiveEdit(true);
          navigate('/admin/services/feedback?sites=true');
        }}
      >
        Register site
      </GoAButton>
    </div>
  );
};
