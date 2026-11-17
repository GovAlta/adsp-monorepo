import { FunctionComponent } from 'react';
import { GoabDropdown, GoabDropdownItem, GoabIcon, GoabTooltip } from '@abgov/react-components';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
import { FlexRow } from '../styled-components';

export interface SharePointDestinationOption {
  id: string;
  name?: string;
}

interface SharePointDestinationSelectProps {
  destinations: Record<string, SharePointDestinationOption> | undefined;
  value?: string | null;
  onChange: (destinationId: string | null) => void;
}

export const SharePointDestinationSelect: FunctionComponent<SharePointDestinationSelectProps> = ({
  destinations,
  value,
  onChange,
}) => {
  const options: SharePointDestinationOption[] = Object.values<SharePointDestinationOption>(destinations ?? {}).sort(
    (a, b) => (a.name || a.id).localeCompare(b.name || b.id),
  );
  const isMissing = !!value && !destinations?.[value];

  return (
    <div style={{ marginBottom: '1rem' }}>
      <FlexRow style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>SharePoint destination</label>
        <GoabTooltip
          content="Optional SharePoint destination to send submitted forms to, including their file attachments. Destinations are set up on the SharePoint service page."
          position="top"
        >
          <GoabIcon type="information-circle" ariaLabel="sharepoint-destination-icon"></GoabIcon>
        </GoabTooltip>
      </FlexRow>
      <div style={{ paddingLeft: '3px' }}>
        <GoabDropdown
          name="sharepointConfigurationId"
          testId="sharepoint-destination"
          width="25rem"
          size="compact"
          value={value || ''}
          onChange={(detail: GoabDropdownOnChangeDetail) => onChange(detail.value || null)}
        >
          <GoabDropdownItem value="" label="No SharePoint destination" />
          {isMissing && <GoabDropdownItem value={value} label={`${value} (not found)`} />}
          {options.map((destination) => (
            <GoabDropdownItem
              key={destination.id}
              value={destination.id}
              label={`${destination.name || destination.id} (${destination.id})`}
            />
          ))}
        </GoabDropdown>
      </div>
    </div>
  );
};
