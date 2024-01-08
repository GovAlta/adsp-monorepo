import React from 'react';
import { CellProps, isNumberControl, RankedTester, rankWith, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { GoAInputNumber } from '../Controls';

export const GoANumberCell = (props: CellProps & WithClassname) => <GoAInputNumber {...props} />;

export const GoANumberCellTester: RankedTester = rankWith(1, isNumberControl);

export default withJsonFormsCellProps(GoANumberCell);
