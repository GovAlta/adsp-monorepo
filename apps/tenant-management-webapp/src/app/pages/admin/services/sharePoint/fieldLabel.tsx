import React, { FunctionComponent } from 'react';
import { GoabIcon, GoabTooltip } from '@abgov/react-components';
import { LabelRow } from './styled-components';

interface FieldLabelProps {
  label: string;
  hint: string;
}

export const InfoHint: FunctionComponent<FieldLabelProps> = ({ label, hint }) => (
  <GoabTooltip content={hint} position="right">
    <GoabIcon type="information-circle" size="small" ariaLabel={`About ${label}`} />
  </GoabTooltip>
);

export const FieldLabel: FunctionComponent<FieldLabelProps> = ({ label, hint }) => (
  <LabelRow>
    <span>{label}</span>
    <InfoHint label={label} hint={hint} />
  </LabelRow>
);
