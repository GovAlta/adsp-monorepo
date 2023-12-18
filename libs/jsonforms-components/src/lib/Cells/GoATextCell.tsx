import React from 'react';
import { CellProps, isStringControl, RankedTester, rankWith, WithClassname } from '@jsonforms/core';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { GoAInputText } from '../Controls';

export const GoATextCell = (props: CellProps & WithClassname) => <GoAInputText {...props} />;

/**
 * Default tester for text-based/string controls.
 * @type {RankedTester}
 */
export const GoATextCellTester: RankedTester = rankWith(1, isStringControl);

export default withJsonFormsCellProps(GoATextCell);
