import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventLogExportModal } from './eventLogExportModal';

describe('EventLogExportModal', () => {
  it('shows a loading spinner and cancel while exporting', () => {
    const onCancel = jest.fn();
    const { container, getByText } = render(
      <EventLogExportModal open={true} isExporting={true} onCancel={onCancel} onClose={jest.fn()} />,
    );

    expect(container.querySelector('goa-modal[testid="export-event-log-modal"]')).toHaveAttribute('open');
    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
    expect(getByText('Exporting event log...')).toBeInTheDocument();

    fireEvent(
      container.querySelector('goa-button[testid="export-event-log-cancel"]') as Element,
      new CustomEvent('_click'),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows close after export completes', () => {
    const onClose = jest.fn();
    const { container, getByText } = render(
      <EventLogExportModal open={true} isExporting={false} rowCount={12} onCancel={jest.fn()} onClose={onClose} />,
    );

    expect(getByText('Export complete. 12 rows included in the CSV file.')).toBeInTheDocument();
    fireEvent(
      container.querySelector('goa-button[testid="export-event-log-close"]') as Element,
      new CustomEvent('_click'),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses singular row wording for one exported item', () => {
    const { getByText } = render(
      <EventLogExportModal open={true} isExporting={false} rowCount={1} onCancel={jest.fn()} onClose={jest.fn()} />,
    );

    expect(getByText('Export complete. 1 row included in the CSV file.')).toBeInTheDocument();
  });
});
