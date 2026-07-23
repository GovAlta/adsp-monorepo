import {
  GoabButton,
  GoabCallout,
  GoabOneColumnLayout,
  GoabAppHeader,
  GoabHeroBanner,
  GoabPageBlock,
  GoabGrid,
  GoabContainer,
  GoabAppFooter,
} from '@abgov/react-components';
import { Link, useNavigate } from 'react-router-dom';
import heroBannerImage from '../assets/hero-banner.png';

export default function Home() {
  const navigate = useNavigate();

  return (
    <GoabOneColumnLayout>
      <section slot="header" className="app-header-shell">
        <GoabAppHeader url="/" heading="Alberta service">
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

      <div className="hero-banner-wrapper">
        <GoabHeroBanner heading="Welcome to your Alberta service" backgroundUrl={heroBannerImage}>
          <p className="hero-subtitle">
            This starter combines an information-focused service website with an integrated ADSP
            application form so teams can prototype and iterate quickly.
          </p>
          <GoabButton size="compact" type="primary" testId="starter-cta" onClick={() => navigate('/apply')}>
            Start application
          </GoabButton>
        </GoabHeroBanner>
      </div>

      <GoabPageBlock width="704px">
        <div className="page-content">
          <section className="section-spacing">
            <h2>Using this starter in Builder</h2>
            <p>
              This template is loaded directly in the Builder preview, where you can live prototype
              your service by asking the AI agent to make changes and then immediately review the
              result.
            </p>
            <p>
              Describe what you want to update, such as page content, components, layout, or routes,
              and iterate in small steps. The agent applies updates to template files like
              src/pages/Home.tsx, src/pages/About.tsx, src/pages/Examples.tsx, src/styles.css, and
              src/App.tsx while you validate each change in preview.
            </p>
          </section>

          <section className="section-spacing">
            <h2>Good prompt examples</h2>
            <p>
              These examples work well because they are specific, scoped, and aligned with Alberta
              government service patterns:
            </p>
            <ul>
              <li>
                Add a new page called Program eligibility with a plain-language checklist and route
                it from the header navigation.
              </li>
              <li>
                Replace the home cards with card-grid content for Income support, Child care
                subsidy, and Seniors benefits using GOA components and sentence casing.
              </li>
              <li>
                Configure src/config/adspForm.ts for your tenant and convert the Apply page from
                mock mode to live ADSP form submission.
              </li>
              <li>
                Update this page to use simpler language for Albertans and keep content at a grade 8
                reading level.
              </li>
              <li>
                Improve mobile spacing and typography on this route while preserving the Alberta
                Design System visual style.
              </li>
              <li>
                Add a status results page that shows Submitted, In review, and Decision made states
                with clear next steps.
              </li>
            </ul>
          </section>

          <section className="section-spacing">
            <h2>What you can build</h2>
            <GoabGrid minChildWidth="30ch">
              <GoabContainer accent="thin">
                <h3>Clear information</h3>
                <p>
                  Present information in a way that's easy for Albertans to understand with plain
                  language and logical structure.
                </p>
              </GoabContainer>

              <GoabContainer accent="thin">
                <h3>Integrated ADSP forms</h3>
                <p>
                  Start with the built-in Apply route, then connect your own ADSP form definition
                  for production-grade submissions.
                </p>
              </GoabContainer>

              <GoabContainer accent="thin">
                <h3>Consistent experience</h3>
                <p>
                  Use Alberta Design System components to create a familiar, trustworthy experience
                  across all government services.
                </p>
              </GoabContainer>
            </GoabGrid>
          </section>

          <section className="section-spacing">
            <h2>Design System Benefits</h2>
            <GoabGrid minChildWidth="30ch">
              <GoabContainer accent="thin">
                <h3>Accessibility</h3>
                <ul>
                  <li>Built-in WCAG compliance</li>
                  <li>Tested with assistive technologies</li>
                  <li>Supports all users, regardless of ability</li>
                </ul>
              </GoabContainer>

              <GoabContainer accent="thin">
                <h3>Consistency</h3>
                <ul>
                  <li>Familiar look and feel</li>
                  <li>Cohesive brand experience</li>
                  <li>Recognized as a GOA service</li>
                </ul>
              </GoabContainer>

              <GoabContainer accent="thin">
                <h3>Quality</h3>
                <ul>
                  <li>Rigorously tested components</li>
                  <li>Cross-browser compatibility</li>
                  <li>Mobile responsive by default</li>
                </ul>
              </GoabContainer>
            </GoabGrid>
          </section>

          <div className="section-spacing">
            <GoabCallout type="information" heading="Alberta Design System">
              Learn more about best practices at{' '}
              <a href="https://design.alberta.ca" target="_blank" rel="noopener noreferrer">
                design.alberta.ca
              </a>
            </GoabCallout>
          </div>
        </div>
      </GoabPageBlock>

      <section slot="footer">
        <GoabAppFooter></GoabAppFooter>
      </section>
    </GoabOneColumnLayout>
  );
}
