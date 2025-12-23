import React from 'react';
import { CellProps, isIntegerControl, RankedTester, rankWith, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { GoabInputInteger } from '../Controls';

export const GoAIntegerCell = (props: CellProps & WithClassname) => <GoabInputInteger {...props} />;

export const GoAIntegerCellTester: RankedTester = rankWith(1, isIntegerControl);

export default withJsonFormsCellProps(GoAIntegerCell);
