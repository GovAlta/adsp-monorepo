import React from 'react';
import { render } from '@testing-library/react';
import { DateTime } from 'luxon';
import { ApplicationStatusCallout } from './SubmittedForm';

describe('ApplicationStatusCallout', () => {
  const submitted = DateTime.fromISO('2026-11-02T10:00:00');

  it('says the application is being processed before a decision is made', () => {
    const { container } = render(<ApplicationStatusCallout submitted={submitted} />);

    const callout = container.querySelector('goa-callout');
    expect(callout.getAttribute('heading')).toBe("We're processing your application");
    expect(callout.textContent).toContain('Your application was received on November 2, 2026');
  });

  it('says a decision was made once the submission is dispositioned', () => {
    const { container } = render(
      <ApplicationStatusCallout
        submitted={submitted}
        disposition={{ status: 'Approved', date: '2026-11-19T15:30:00.000Z' }}
      />,
    );

    const callout = container.querySelector('goa-callout');
    expect(callout.getAttribute('heading')).toBe('Decision made');
    expect(callout.textContent).toContain('Approved');
    expect(callout.textContent).toContain('November 19, 2026');
    expect(callout.textContent).not.toContain("we're working on it");
  });

  it('shows the content passed to it', () => {
    const { getByText } = render(
      <ApplicationStatusCallout submitted={submitted}>
        <span>Download PDF copy</span>
      </ApplicationStatusCallout>,
    );

    expect(getByText('Download PDF copy')).toBeTruthy();
  });
});
