import {
  GoabButton,
  GoabCallout,
  GoabOneColumnLayout,
  GoabAppHeader,
  GoabPageBlock,
  GoabGrid,
  GoabAppFooter,
} from '@abgov/react-components';
import { Link } from 'react-router-dom';

export default function Examples() {
  return (
    <GoabOneColumnLayout>
      <section slot="header" className="app-header-shell">
        <GoabAppHeader url="/" heading="Government Service">
          <Link to="/apply" style={{ textDecoration: 'none', color: 'inherit' }}>
            Apply
          </Link>
          <Link to="/components" style={{ textDecoration: 'none', color: 'inherit' }}>
            Components
          </Link>
          <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
            About
          </Link>
        </GoabAppHeader>
      </section>

      <GoabPageBlock width="704px">
        <div className="page-content">
          <h1 className="page-title">Design System Components</h1>
          <p>
            This starter includes the Alberta Design System components. Here are some examples of
            what you can build.
          </p>

          <section className="section-spacing">
            <h2>Service Page Patterns</h2>
            <GoabGrid minChildWidth="30ch">
              <div className="feature-card">
                <h3>Information Pages</h3>
                <ul>
                  <li>Program overview and eligibility</li>
                  <li>Step-by-step process guides</li>
                  <li>FAQs and common questions</li>
                </ul>
              </div>

              <div className="feature-card">
                <h3>Application Forms</h3>
                <ul>
                  <li>ADSP form definition integration</li>
                  <li>JSON schema-driven validation</li>
                  <li>Submission confirmation and references</li>
                </ul>
              </div>

              <div className="feature-card">
                <h3>Results Pages</h3>
                <ul>
                  <li>Status updates and confirmations</li>
                  <li>Data tables with filters</li>
                  <li>Success/error messages</li>
                </ul>
              </div>
            </GoabGrid>
          </section>

          <section className="section-spacing">
            <h2>Getting Started</h2>
            <p>You can customize this template by:</p>
            <ul>
              <li>Updating the navigation and page titles</li>
              <li>Adding your service's content and information</li>
              <li>Configuring src/config/adspForm.ts for your tenant and form</li>
              <li>Adding new pages and routes in App.tsx</li>
              <li>Using all available components from design.alberta.ca</li>
            </ul>
          </section>

          <div className="section-spacing">
            <GoabCallout type="information" heading="Pro Tip">
              Start with the components and patterns from{' '}
              <a
                href="https://design.alberta.ca/components"
                target="_blank"
                rel="noopener noreferrer"
              >
                design.alberta.ca/components
              </a>
              . These cover about 80% of government service needs.
            </GoabCallout>
          </div>

          <div className="section-spacing button-group">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <GoabButton size="compact" type="secondary">
                Back to home
              </GoabButton>
            </Link>
            <Link to="/about" style={{ textDecoration: 'none' }}>
              <GoabButton size="compact" type="text">
                About this starter
              </GoabButton>
            </Link>
          </div>
        </div>
      </GoabPageBlock>

      <section slot="footer">
        <GoabAppFooter></GoabAppFooter>
      </section>
    </GoabOneColumnLayout>
  );
}
