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

  it('should render additional instructions with information callout type', () => {
    const { container } = render(
      <table>
        <tbody>
          <AdditionalInstructionsRow additionalInstructions="Test instructions" calloutType="information" />
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
          <AdditionalInstructionsRow additionalInstructions="Important message" calloutType="important" />
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
          <AdditionalInstructionsRow additionalInstructions="Emergency message" calloutType="emergency" />
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
          <AdditionalInstructionsRow additionalInstructions="Success message" calloutType="success" />
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
          <AdditionalInstructionsRow additionalInstructions="Event message" calloutType="event" />
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
          <AdditionalInstructionsRow additionalInstructions="Test instructions" calloutType="invalid-type" />
        </tbody>
      </table>
    );
    expect(screen.getByText('Test instructions')).toBeInTheDocument();
    expect(container.querySelector('[type="information"]')).toBeInTheDocument();
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
});
