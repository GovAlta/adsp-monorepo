import React from 'react';
import { CellProps, isTimeControl, RankedTester, rankWith, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { GoADateInput } from '../Controls';

export const GoATimeCell = (props: CellProps & WithClassname) => <GoADateInput {...props} />;

export const GoATimeCellTester: RankedTester = rankWith(2, isTimeControl);

export default withJsonFormsCellProps(GoATimeCell);
