import { GoATextCell, GoATextCellTester } from './TextCell';
import { GoADateCell, GoADateCellTester } from './DateCell';
import { GoANumberCell, GoANumberCellTester } from './NumberCell';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
export const InputCells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: GoATextCellTester, cell: withJsonFormsCellProps(GoATextCell) },
  { tester: GoADateCellTester, cell: withJsonFormsCellProps(GoADateCell) },
  { tester: GoANumberCellTester, cell: withJsonFormsCellProps(GoANumberCell) },
];
