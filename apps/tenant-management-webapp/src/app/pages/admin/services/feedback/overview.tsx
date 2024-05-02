import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components-new';

import { useDispatch } from 'react-redux';
import { PRE } from '../feedback/styled-components';

interface OverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (index: number) => void;
}

export const FeedbackOverview: FunctionComponent<OverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex } = props;

  const dispatch = useDispatch();

  return (
    <div>
      <section>
        <p>
          The feedback service provides a backend API and a frontend widget for applications to accept feedback from
          users. Feedback comments are anonymized using the PII service and records are stored and available from the
          Value service API.
        </p>
        <p>
          <b>Sites section:</b> Configure the sites against which feedback is allowed. Enable anonymous feedback for a
          site so that unauthenticated users can send feedback directly to the API, but note that this could reduce the
          quality of feedback.
        </p>
        <p>
          <b>Widget section:</b> Include the feedback script in your site, and initialize it from javascript. On
          initialization, the script will attach a widget element which includes a badge and form that users can use to
          send feedback.
          <ul className="goa-unordered-list">
            <li>Include a code example of the &lt;script&gt; with src to feedback API in &lt;head&gt;</li>
            <li>
              include a code example of the &lt;script&gt; in body to{' '}
              <PRE>adspFeedback.initialize(&#123;tenant: &quot;&lt;tenant name&gt;&quot;&#125;)</PRE>
            </li>
          </ul>
        </p>
      </section>
      <GoAButton
        testId="add-definition"
        onClick={() => {
          setActiveEdit(true);
        }}
      >
        Add site
      </GoAButton>
    </div>
  );
};
