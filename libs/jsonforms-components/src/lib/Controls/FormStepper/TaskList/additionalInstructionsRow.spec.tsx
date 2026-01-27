import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdditionalInstructionsRow } from './additionalInstructionsRow';

describe('AdditionalInstructionsRow Component', () => {
  it('should render additional instructions with default information type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions="Test instructions" />
        </tbody>
      </table>
    );
    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    expect(container.querySelector('[type="information"]')).toBeInTheDocument();
  });

  it('should render additional instructions with information callout type via componentProps', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow
            additionalInstructions="Test instructions"
            componentProps={{ type: 'information' }}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    expect(container.querySelector('[type="information"]')).toBeInTheDocument();
  });

  it('should render additional instructions with important callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow
            additionalInstructions="Important message"
            componentProps={{ type: 'important' }}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('Important message')).toBeInTheDocument();
    expect(container.querySelector('[type="important"]')).toBeInTheDocument();
  });

  it('should render additional instructions with emergency callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow
            additionalInstructions="Emergency message"
            componentProps={{ type: 'emergency' }}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('Emergency message')).toBeInTheDocument();
    expect(container.querySelector('[type="emergency"]')).toBeInTheDocument();
  });

  it('should render additional instructions with success callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions="Success message" componentProps={{ type: 'success' }} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(container.querySelector('[type="success"]')).toBeInTheDocument();
  });

  it('should render additional instructions with event callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions="Event message" componentProps={{ type: 'event' }} />
        </tbody>
      </table>
    );
    expect(screen.getByText('Event message')).toBeInTheDocument();
    expect(container.querySelector('[type="event"]')).toBeInTheDocument();
  });

  it('should default to information type for invalid callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow
            additionalInstructions="Test instructions"
            componentProps={{ type: 'invalid-type' }}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    expect(container.querySelector('[type="information"]')).toBeInTheDocument();
  });

  it('should render with long text content', () => {
    const longText =
      'This is a very long instruction text that should be displayed properly in the callout component. '.repeat(5);
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions={longText} />
        </tbody>
      </table>
    );
    // Check that the callout contains the text (web components may handle whitespace differently)
    const callout = container.querySelector('goa-callout');
    expect(callout).toBeInTheDocument();
    expect(callout?.textContent).toContain('This is a very long instruction text');
  });

  it('should render as table row with correct colspan', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions="Test instructions" />
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('colSpan', '2');
  });

  it('should pass additional props from componentProps to GoabCallout', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow
            additionalInstructions="Test instructions"
            componentProps={{ type: 'information', mt: 'm', mb: 's' }}
          />
        </tbody>
      </table>
    );
    const callout = container.querySelector('goa-callout');
    expect(callout).toBeInTheDocument();
    expect(callout).toHaveAttribute('mt', 'm');
    expect(callout).toHaveAttribute('mb', 's');
  });
});
