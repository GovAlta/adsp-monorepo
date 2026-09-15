import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SectionState } from '@store/serviceReports/models';
import { ReportSection } from './reportSection';

const idle: SectionState = { status: 'idle', data: null };

describe('ReportSection', () => {
  it('renders the section title as a visible heading', () => {
    render(
      <ReportSection title="Summary" testId="reports-section-summary" state={idle} placeholder={<p>placeholder</p>} />
    );

    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
  });

  it('renders an emergency callout when status is error', () => {
    render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={{ status: 'error', data: null, error: 'gateway unavailable' }}
        placeholder={<p>placeholder</p>}
      >
        <p>content</p>
      </ReportSection>
    );

    expect(screen.getByText('gateway unavailable')).toBeInTheDocument();
  });

  it('renders a skeleton when status is loading and there is no data', () => {
    const { container } = render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={{ status: 'loading', data: null }}
        placeholder={<p>placeholder</p>}
      >
        <p>content</p>
      </ReportSection>
    );

    expect(container.querySelector('goa-skeleton')).toBeInTheDocument();
  });

  it('renders the placeholder when status is idle', () => {
    render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={idle}
        placeholder={<p>placeholder body</p>}
      >
        <p>content</p>
      </ReportSection>
    );

    expect(screen.getByText('placeholder body')).toBeInTheDocument();
  });

  it('renders the empty-period message when status is loaded and data is null', () => {
    render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={{ status: 'loaded', data: null }}
        placeholder={<p>placeholder</p>}
      >
        <p>content</p>
      </ReportSection>
    );

    expect(screen.getByText('No data for the selected period')).toBeInTheDocument();
  });

  it('renders the empty-period message when status is loaded and data is an empty array', () => {
    render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={{ status: 'loaded', data: [] }}
        placeholder={<p>placeholder</p>}
      >
        <p>content</p>
      </ReportSection>
    );

    expect(screen.getByText('No data for the selected period')).toBeInTheDocument();
  });

  it('renders children when status is loaded and data is present', () => {
    render(
      <ReportSection
        title="Summary"
        testId="reports-section-summary"
        state={{ status: 'loaded', data: { pdfGenerated: 4 } }}
        placeholder={<p>placeholder</p>}
      >
        <p>loaded content</p>
      </ReportSection>
    );

    expect(screen.getByText('loaded content')).toBeInTheDocument();
  });
});
