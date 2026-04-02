import {
  GoabButton,
  GoabOneColumnLayout,
  GoabAppHeader,
  GoabPageBlock,
  GoabCallout,
  GoabAppFooter,
} from '@abgov/react-components';
import { Link } from 'react-router-dom';

export default function About() {
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
          <h1 className="page-title">About This Starter</h1>
          <p className="lead-text">
            This is a starter template for building Alberta government services using the Design
            System and React.
          </p>

          <section className="section-spacing">
            <h2>Built with Design System</h2>
            <p>
              This template uses components, patterns, and design tokens from the Alberta Design
              System. It provides a solid foundation for building accessible, consistent, and
              user-centered government services.
            </p>
            <p>
              Learn more at{' '}
              <a href="https://design.alberta.ca" target="_blank" rel="noopener noreferrer">
                design.alberta.ca
              </a>
            </p>
          </section>

          <section className="section-spacing">
            <h2>Technology Stack</h2>
            <ul>
              <li>
                <strong>React</strong> — UI framework for building interactive interfaces
              </li>
              <li>
                <strong>React Router</strong> — Client-side routing for multi-page applications
              </li>
              <li>
                <strong>@abgov/react-components</strong> — Alberta Design System components
              </li>
              <li>
                <strong>@abgov/jsonforms-components</strong> — ADSP-ready JSON forms renderers
              </li>
              <li>
                <strong>TypeScript</strong> — Type-safe JavaScript for better code quality
              </li>
              <li>
                <strong>Vite</strong> — Fast build tool for modern web development
              </li>
            </ul>
          </section>

          <section className="section-spacing">
            <h2>ADSP form integration</h2>
            <p>To configure this starter with your own ADSP form:</p>
            <ol>
              <li>
                Update src/config/adspForm.ts with service name, tenant URL, and definition ID
              </li>
              <li>Start in mock mode to iterate quickly in Builder preview</li>
              <li>Switch mode to live and provide an access token for authenticated requests</li>
              <li>Refine service information pages and the Apply route with follow-up prompts</li>
              <li>Validate submission and confirmation content for plain-language clarity</li>
            </ol>
          </section>

          <section className="section-spacing">
            <h2>Builder workflow</h2>
            <p>Use this flow while working inside Builder:</p>
            <ol>
              <li>Ask the AI agent for a focused change, such as a new section or form step</li>
              <li>Check the preview to confirm behavior, layout, and content</li>
              <li>Prompt again to refine copy, components, spacing, or interactions</li>
              <li>Validate navigation after route or page updates</li>
              <li>Use GOA components and examples as the primary implementation reference</li>
            </ol>
          </section>

          <section className="section-spacing">
            <h2>Design System Resources</h2>
            <GoabCallout type="information" heading="Official Resources">
              <ul style={{ marginBottom: 0 }}>
                <li>
                  <a
                    href="https://design.alberta.ca/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Getting Started Guide
                  </a>
                </li>
                <li>
                  <a
                    href="https://design.alberta.ca/components"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Component Library
                  </a>
                </li>
                <li>
                  <a
                    href="https://design.alberta.ca/design-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Design Tokens
                  </a>
                </li>
                <li>
                  <a
                    href="https://design.alberta.ca/examples"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Patterns & Examples
                  </a>
                </li>
              </ul>
            </GoabCallout>
          </section>

          <div className="section-spacing button-group">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <GoabButton type="secondary">Back to home</GoabButton>
            </Link>
            <Link to="/components" style={{ textDecoration: 'none' }}>
              <GoabButton type="tertiary">View components</GoabButton>
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
