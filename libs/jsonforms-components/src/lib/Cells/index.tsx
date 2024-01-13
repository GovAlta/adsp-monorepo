import { GoATextCell, GoATextCellTester } from './TextCell';
import { GoADateCell, GoADateCellTester } from './DateCell';
import { GoATimeCell, GoATimeCellTester } from './TimeCell';
import { GoANumberCell, GoANumberCellTester } from './NumberCell';
import { GoAIntegerCell, GoAIntegerCellTester } from './IntegerCell';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
export const InputCells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: GoATextCellTester, cell: withJsonFormsCellProps(GoATextCell) },
  { tester: GoADateCellTester, cell: withJsonFormsCellProps(GoADateCell) },
  { tester: GoATimeCellTester, cell: withJsonFormsCellProps(GoATimeCell) },
  { tester: GoANumberCellTester, cell: withJsonFormsCellProps(GoANumberCell) },
  { tester: GoAIntegerCellTester, cell: withJsonFormsCellProps(GoAIntegerCell) },
];
