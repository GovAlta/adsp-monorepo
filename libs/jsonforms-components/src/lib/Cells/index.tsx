import { GoATextCell, GoATextCellTester } from './TextCell';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
export const InputCells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: GoATextCellTester, cell: withJsonFormsCellProps(GoATextCell) },
];
