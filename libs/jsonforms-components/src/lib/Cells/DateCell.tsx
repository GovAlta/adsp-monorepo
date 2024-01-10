import React from 'react';
import { CellProps, isDateControl, RankedTester, rankWith, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { GoADateInput } from '../Controls';

export const GoADateCell = (props: CellProps & WithClassname) => <GoADateInput {...props} />;

export const GoADateCellTester: RankedTester = rankWith(1, isDateControl);

export default withJsonFormsCellProps(GoADateCell);
