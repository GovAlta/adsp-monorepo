import { GoATextCell, GoATextCellTester } from './GoATextCell';
import { withJsonFormsCellProps } from '@jsonforms/react';
import { JsonFormsCellRendererRegistryEntry } from '@jsonforms/core';
export const GoACells: JsonFormsCellRendererRegistryEntry[] = [
  { tester: GoATextCellTester, cell: withJsonFormsCellProps(GoATextCell) },
];
