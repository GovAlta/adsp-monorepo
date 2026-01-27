import React from 'react';
import { GoabCallout } from '@abgov/react-components';
import { GoabCalloutType } from '@abgov/ui-components-common';

interface AdditionalInstructionsRowProps {
  additionalInstructions: string;
  calloutType?: GoabCalloutType | string;
}

export const AdditionalInstructionsRow: React.FC<AdditionalInstructionsRowProps> = ({
  additionalInstructions,
  calloutType = 'information',
}) => {
  const validTypes: GoabCalloutType[] = ['information', 'important', 'emergency', 'success', 'event'];
  const type = (validTypes.includes(calloutType as GoabCalloutType) ? calloutType : 'information') as GoabCalloutType;

  return (
    <tr>
      <td colSpan={2}>
        <GoabCallout type={type} mt="xl" mb="l">
          {additionalInstructions}
        </GoabCallout>
      </td>
    </tr>
  );
};
