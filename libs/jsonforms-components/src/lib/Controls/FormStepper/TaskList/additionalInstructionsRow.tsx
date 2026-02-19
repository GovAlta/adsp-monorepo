import React from 'react';
import { GoabCallout } from '@abgov/react-components';
import { GoabCalloutType } from '@abgov/ui-components-common';

interface AdditionalInstructionsRowProps {
  additionalInstructions: string;
  componentProps?: {
    type?: GoabCalloutType | string;
    [key: string]: unknown;
  };
}

export const AdditionalInstructionsRow: React.FC<AdditionalInstructionsRowProps> = ({
  additionalInstructions,
  componentProps,
}) => {
  const validTypes: GoabCalloutType[] = ['information', 'important', 'emergency', 'success', 'event'];
  const calloutType = componentProps?.type || 'information';
  const type = (validTypes.includes(calloutType as GoabCalloutType) ? calloutType : 'information') as GoabCalloutType;

  const { type: _, ...otherProps } = componentProps || {};

  return (
    <tr>
      <td colSpan={2}>
        <GoabCallout type={type} mt="xl" mb="l" {...otherProps}>
          <div dangerouslySetInnerHTML={{ __html: additionalInstructions }} />
        </GoabCallout>
      </td>
    </tr>
  );
};
