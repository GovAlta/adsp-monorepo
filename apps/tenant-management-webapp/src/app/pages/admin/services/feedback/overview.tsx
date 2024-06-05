import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';
import { PRE, FeedbackSubHeading, FeedbackOverviewSection } from '../feedback/styled-components';
import { useNavigate } from 'react-router-dom';
import { NoPaddingH2 } from '@components/AppHeader';
import { ExternalLink } from '@components/icons/ExternalLink';

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
        <ul className="goa-unordered-list">
          <li> Code example of the &lt;script&gt; with src to feedback API in &lt;head&gt;</li>
          <PRE>
            &lt;head&gt; <br></br> ... <br></br>
            &lt;script src=&quot;https://feedback-service.adsp.alberta.ca/feedback/v1/script/adspFeedback.js&quot;&gt;
            &lt;/script&gt;<br></br>&lt;/head&gt;
          </PRE>
          <li>
            Code example of the &lt;script&gt; in body to{' '}
            <PRE>
              &lt;body&gt; <br></br> ... <br></br>&lt;script&gt; adspFeedback.initialize(&#123;tenant: &apos;&lt;tenant
              name&gt;&apos;&#125;)<br></br>&lt;/script&gt;<br></br>&lt;/body&gt;
            </PRE>
          </li>
        </ul>
        <p>
          For more information on integrating the feedback service with your application please see the{' '}
          <ExternalLink
            testId="feedback-tutorial-link"
            link="https://govalta.github.io/adsp-monorepo/tutorials/feedback-service/collectingFeedback.html"
            text="feedback service tutorial"
          />
        </p>
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
