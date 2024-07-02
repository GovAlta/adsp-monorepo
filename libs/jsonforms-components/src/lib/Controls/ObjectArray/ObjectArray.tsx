import React, { useCallback, useState } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  uiTypeIs,
  and,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps } from '@jsonforms/react';
import { ObjectArrayControl } from './ObjectListControl';
import { DeleteDialog } from './DeleteDialog';
import { Visible } from '../../util';

export const ArrayControl = (props: ArrayLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string>();
  const [rowData, setRowData] = useState<number>(0);
  const { removeItems, visible } = props;

  const openDeleteDialog = useCallback(
    (p: string, rowIndex: number) => {
      setOpen(true);
      setPath(p);
      setRowData(rowIndex);
    },
    [setOpen, setPath, setRowData]
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);

  // eslint-disable-next-line
  const deleteConfirm = useCallback(() => {
    const p = path?.substring(0, path.lastIndexOf('.'));
    if (removeItems && p) {
      removeItems(p, [rowData])();
    }
    setOpen(false);
    // eslint-disable-next-line
  }, [setOpen, path, rowData]);

  return (
    <Visible visible={visible}>
      <ObjectArrayControl {...props} openDeleteDialog={openDeleteDialog} />
      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        title={props.translations.deleteDialogTitle || ''}
        message={props.translations.deleteDialogMessage || ''}
      />
    </Visible>
  );
};

export const ArrayBaseReviewControl = (props: ArrayLayoutProps) => {
  const { visible } = props;

  return (
    <Visible visible={visible}>
      <ObjectArrayControl {...props} openDeleteDialog={() => {}} isStepperReview={true} />
    </Visible>
  );
};
export const GoAArrayControlTester: RankedTester = rankWith(3, or(isObjectArrayControl, isPrimitiveArrayControl));
export const GoAArrayControlRenderer = withJsonFormsArrayLayoutProps(ArrayControl);
export const GoAArrayControlReviewRenderer = withJsonFormsArrayLayoutProps(ArrayBaseReviewControl);

export const GoAListWithDetailsTester: RankedTester = rankWith(3, and(uiTypeIs('ListWithDetail')));
