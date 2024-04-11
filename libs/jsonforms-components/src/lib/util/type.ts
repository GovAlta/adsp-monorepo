import React, { ReactNode } from 'react';
import { EnumOption } from '@jsonforms/core';

export interface WithOptionLabel {
  getOptionLabel?(option: EnumOption): string;
  renderOption?(props: React.HTMLAttributes<HTMLLIElement>, option: EnumOption): ReactNode;
}
